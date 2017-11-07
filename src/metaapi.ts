
import {
  IAPIModel, IAPIModelBuilder, IAPIModelRegistry,
  IAPIOperation,
  IAPIRequestModel,
  IAPIResponseModel
} from './api';

import {
  JsonPointer,
  JsonReferenceProcessor
} from '@hn3000/json-ref';

import {
  IModelType,
  IModelTypeComposite,
  ModelTypeObject,
  ModelSchemaParser
} from '@hn3000/metamodel';

import { TemplateFactory, Template } from '@hn3000/simpletemplate';

import * as SwaggerSchema from 'swagger-schema-official';

import * as fetch from 'isomorphic-fetch';

export type FetchFun = (url:string) => Promise<string>;

const templateFactory = new TemplateFactory({ pattern: '{X}'});

interface IParamRenderer<Req> {
  (req: Req): string[]
}

export class Operation<Req, Resp> implements IAPIOperation<Req, Resp> {
  constructor();
  constructor(initArg: Partial<IAPIOperation<Req,Resp>>);
  constructor(...args:any[]) {
    if (args.length === 1 && null != args[0].id) {
      const initArgs = args[0];
      this.init(initArgs);
    }
  }

  init(initArg: Partial<IAPIOperation<Req,Resp>>) {
    this._id = initArg.id;
    this._name = initArg.name;
    this._method = initArg.method;
    this._pathPattern = initArg.pathPattern;
    this._pathTemplate = templateFactory.parse(initArg.pathPattern);
    this._requestModel = initArg.requestModel;
    this._responseModel = initArg.responseModel;
    this._buildParamRenderer();
  }

  public get id() : string { return this._id; }
  public get name() : string { return this._name; }

  public get pathPattern(): string { return this._pathPattern; }
  public get method(): string { return this._method; }

  public get requestModel(): IAPIRequestModel<Req> { return this._requestModel; }
  public get responseModel(): IAPIResponseModel<Resp> { return this._responseModel; }
  path(req: Req): string {
    return this._pathTemplate.render(req);
  }

  query(req: Req): string {
    let paramRenderers = this._paramRenderers;
    if (null == paramRenderers || 0 == paramRenderers.length) {
      return '';
    }
    let items: string[];
    items = this._paramRenderers.reduce((r, x) => {
      r.push(...x(req));
      return r;
    }, []);
    return '?'+items.join('&');
  }

  public body(req: any): string {
    let format = this.requestModel.format;
    let { paramsByLocation } = this.requestModel;
    let result = null;
    if (null != paramsByLocation.body) {
      let bodyParams = paramsByLocation.body;
      result = JSON.stringify(req[bodyParams[0]]);
    } else if (null != paramsByLocation.formData) {
      let formParams = paramsByLocation.formData;
      result = '';
      for (let p of formParams) {
        if (0 !== result.length) {
          result += '&';
        }
        result += `${p}=${req[p]}`; // TODO: proper quoting
      }
    }

    return result;
  }

  public headers(req: any): { [key: string]: string } {
    let headers: { [key: string]: string } = {};
    let vars = this.requestModel.paramsByLocation['header'];

    for (let v of vars) {
      if (null != req[v]) {
        headers[v] = req[v].toString();
      }
    }
    if (this.requestModel.paramsByLocation['body']) {
      headers['Content-Type'] = 'application/json';
    } else if (this.requestModel.paramsByLocation['formData']) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    return headers;
  }

  private _buildParamRenderer() {
    let rqModel = this._requestModel;
    if (
      null == rqModel
      || null == rqModel.paramsType
      || null == rqModel.paramsByLocation
      || null == rqModel.paramsByLocation.query
    ) {
      return;
    }

    let rqType = rqModel.paramsType as IModelTypeComposite<Req>;
    let queryParams = rqModel.paramsByLocation.query;

    this._paramRenderers = rqModel.paramsByLocation.query.map(
      function mapName2Renderer (name: string) {
      let pt = rqType.itemType(name);
      if (pt.kind === 'array') {
        let schema = pt.propGet('schema');
        let format = schema && schema.format;
        switch (format) {
          case 'multi': return arrayMultiRenderer(name);
          case 'tsv': return arraySSVRenderer(name, '\t');
          case 'ssv': return arraySSVRenderer(name, ' ');
          case 'csv':
          default:
            return arraySSVRenderer(name, ',');
        }
      }
      return stringRenderer(name);
    });
  }

  private _id: string;
  private _name: string;
  private _method: string;
  private _pathPattern: string;
  private _pathTemplate: Template;
  private _paramRenderers: IParamRenderer<Req>[];
  private _requestModel: IAPIRequestModel<Req>;
  private _responseModel: IAPIResponseModel<Resp>;
}


function arraySSVRenderer<Req>(name: string, sep: String): (req: Req) => string[] {
  return (req: Req) => {
    let v = (req as any)[name];

    if (null == v) {
      return [ ];
    }

    return [ `${name}=${v.join(sep)}` ];
  };
}

function arrayMultiRenderer<Req>(name: string): (req: Req) => string[] {
  return (req: Req) => {
    let v = (req as any)[name] as string[];

    if (null == v) {
      return [ ];
    }

    return v.map(x => `${name}=${x}` );
  };
}

function stringRenderer<Req>(name: string): (req: Req) => string[] {
  return (req: Req) => {
    let v = (req as any)[name] as any;

    if (!v) {
      return [ ];
    }

    return [ `${name}=${v.toString()}` ];
  };
}

export class APIModel implements IAPIModel, IAPIModelBuilder {

  constructor(operations: ReadonlyArray<IAPIOperation<any, any>>, base: string) {
    this._operations = operations.slice();
    this._base = base;
    this._operationsById = { };
    let opsById = this._operationsById;

    for (let op of this._operations) {
      if (opsById[op.id]) {
        console.log(`duplicate id for operation ${op.id}: ${opsById[op.id]} ${op}`);
      }
      opsById[op.id] = op;
    }
  }
  get base(): string {
    return this._base;
  }

  operations() {
    return Object.freeze(this._operations);
  }

  operationById(id: string) {
    return this._operationsById[id];
  }

  subModel(keys: string[]) {
    return new APIModel(keys.map(k => this._operationsById[k]), this._base);
  }

  add(op: IAPIOperation<any, any>) {
    this._operationsById[op.id] = op;
    return this;
  }
  remove(id: string) {
    let op = this._operationsById[id];
    if (null != op) {
      let index = this._operations.indexOf(op);
      if (-1 != index) {
        this._operations.splice(index, 1);
      }
      delete this._operationsById[id];
    }
    return this;
  }
  setBase(base: string) {
    this._base = base;
  }

  private _base: string;
  private _operations: IAPIOperation<any, any>[];
  private _operationsById: { [id: string]: IAPIOperation<any, any>; };
}

interface IPathOptions {
  parameters: SwaggerSchema.Parameter[];

  [extensionProp: string]: any;
};

export class APIModelRegistry implements IAPIModelRegistry {
  constructor(fetchFun?: FetchFun) {
    this._schemas = new ModelSchemaParser();
    this._fetchFun = fetchFun || fetchFetcher;
    this._jsonRefProcessor = new JsonReferenceProcessor(this._fetchFun);
  }

  parseParameterType(opSpec: SwaggerSchema.Operation, id: string, extraParameters: SwaggerSchema.Parameter[]): IAPIRequestModel<any> {
    let result: IAPIRequestModel<any> = {
      format: "empty",
      locationsByParam: { },
      paramsByLocation: { }
    };
    let parameters = opSpec.parameters;
    if (null == parameters || 0 === parameters.length) {
      return result;
    }
    let composite = new ModelTypeObject<any>(`${id}Params`);
    result.paramsType = composite;
    let locationByParam =  result.locationsByParam;
    let paramsByLocation = result.paramsByLocation;

    parameters.forEach(p => {
      let { name, required } = p;
      if (paramsByLocation[p.in] == null) {
        paramsByLocation[p.in] = [ name ];
      } else {
        paramsByLocation[p.in].push(name);
      }
      locationByParam[name] = p.in;

      let type = null;
      if (p.in === 'body') {
        let { schema } = p as SwaggerSchema.BodyParameter;
        type = this._schemas.addSchemaObject(`${id}Body`, schema);
      } else if (p.in === 'formData') {
        let pp = p as SwaggerSchema.FormDataParameter;
        type = this._schemas.addSchemaObject(`${id}-${name}`, pp);
      } else if (p.in === 'query') {
        let pp = p as SwaggerSchema.QueryParameter;
        type = this._schemas.addSchemaObject(`${id}-${name}`, pp);
      } else if (p.in === 'header') {
        let pp = p as SwaggerSchema.HeaderParameter;
        type = this._schemas.addSchemaObject(`${id}-${name}`, pp);
      } else {
        let pp = p as SwaggerSchema.PathParameter;
        type = this._schemas.addSchemaObject(`${id}-${name}`, pp);
        if (!required) {
          console.warn(`path parameter should be required: ${id}-${name}`);
          required = true;
        }
      }
      if (type != null) {
        type.propSet('schema', p);
        composite.addItem(name, type, required);
      } else {
        console.warn(`no type found for ${id}-${name} / ${p}`);
      }
    });

    if (paramsByLocation['body'] != null && 1 < paramsByLocation['body'].length) {
      console.log(`multiple in: body parameters found: ${paramsByLocation['body'].join(',')}, ${name}`);
    }
    if (paramsByLocation['body'] && paramsByLocation['formData']) {
      console.log(`both in: body and in: formData parameters found: ${paramsByLocation['body'].join(',')}; ${paramsByLocation['formData'].join(',')}, ${name}`);
    }
    return result;
  }

  parseAPIDefinition(spec: SwaggerSchema.Spec, id: string): IAPIModel {
    let operations = [] as IAPIOperation<any,any>[];
    let currentPathOptions: IPathOptions = null;

    JsonPointer.walkObject(spec, (x,p) => {
      let keys = p.keys;
      if (keys.length < 1) {
        return true;
      }
      if ('paths' === keys[0]) {
        if (3 < keys.length) {
          return true;
        }
        if (2 == keys.length) {
          let pathSpec: any /*SwaggerSchema.Path*/ = x; // declaration of Path does not allow extension properties
          let keys = Object.keys(pathSpec).filter(x => !isMethod(x));

          currentPathOptions = keys.reduce((k:string, o:any) => ({...o, k: pathSpec[k]}), {});

        } else if (3 == keys.length && isMethod(keys[2])) {
          let opSpec: SwaggerSchema.Operation = x;
          let pathPattern = keys[1];
          let method = keys[2];
          let id = opSpec.operationId || pathPattern+'_'+method;
          let requestModel = this.parseParameterType(opSpec, id, currentPathOptions.parameters);

          let responseModel: IAPIResponseModel<any> = {
            '200': null
          };

          if (null == opSpec.responses) {
            console.warn(`no responses in ${keys.join('.')}`)
          } else {
            for (let status of Object.keys(opSpec.responses)) {
              let typename = `${id}Response${status}`;
              let response = opSpec.responses[status];
              let schema = response && response.schema;
              if (null != schema) {
                responseModel[status] = this._schemas.addSchemaObject(typename, schema)
              } else {
                responseModel[status] = null;
              }
            }
          }

          let pathTemplate = templateFactory.parse(pathPattern);

          /*
          {
            id,
            name: id,
            pathPattern, method,
            requestModel,
            responseModel,
            path: pathTemplate.render.bind(pathTemplate)
          }          */
          operations.push(new Operation({
            id,
            name: id,
            pathPattern, method,
            requestModel,
            responseModel
          }));
        }
      }

      return false;
    });

    let base = spec.basePath;

//console.log(`create APIModel ${operations}, ${base}`)
    let result = new APIModel(operations, base);

    return result;
  }

  fetchModel(url: string, id: string) : Promise<IAPIModel> {
    return (
      //fetch(url)
      //.then(response => response.text())
      //.then(body => JSON.parse(body))
      this._jsonRefProcessor.expandRef(url)
      .then(x => this.parseAPIDefinition(x, id||url))
    );
  }

  model(id: string) {
    return this._modelById[id];
  }

  private _modelById: { [id: string]: IAPIModel; };
  private _schemas: ModelSchemaParser;

  private _jsonRefProcessor: JsonReferenceProcessor;
  private _fetchFun: FetchFun;
}


function fetchFetcher(url:string):Promise<string> {
  var p = fetch(url);

  return p.then(function (r:any) {
    if (r.status < 300) {
      var x = r.text();
      return x;
    }
    return null;
  });
}

const methodRE = /^(get|put|post|delete|options|head|patch)$/;

function isMethod(method: string) {
  return methodRE.test(method);
}
