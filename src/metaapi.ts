
import {
  IAPIModel, IAPIModelBuilder, IAPIModelRegistry,
  IAPIOperation,
  IAPIRequestModel,
  IAPIResponseModel,
  ParamLocation,
  IAPIOperationInit
} from './api';

import {
  JsonPointer,
  JsonReferenceProcessor
} from '@hn3000/json-ref';

import {
  IModelTypeComposite,
  ModelTypeObject,
  ModelSchemaParser,
  ModelTypeAny,
  modelTypes,
  ClientProps,
  IClientProps
} from '@hn3000/metamodel';

import { TemplateFactory, Template } from '@hn3000/simpletemplate';

import * as SwaggerSchema from 'swagger-schema-official';

import * as fetch from 'isomorphic-fetch';

export type FetchFun = (url:string) => Promise<string>;

const templateFactory = new TemplateFactory({ pattern: '{X}'});

const ModelTypeANY = new ModelTypeAny('unknown model type');

interface IParamRenderer<Req> {
  (req: Req): string[]
}

let opCounter = 1;

export class Operation<Req, Resp> extends ClientProps implements IAPIOperation<Req, Resp> {
  //constructor();
  constructor(initArg: IAPIOperationInit<Req,Resp>) {
    super();
    this.init(initArg);
  }

  init(initArg: IAPIOperationInit<Req,Resp>) {
    this._id = initArg.id;
    this._name = initArg.name || `anon-op-${opCounter++}`;
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
    }, [] as string[]);
    return '?'+items.join('&');
  }

  public body(req: any): undefined | string {
    let format = this.requestModel.format;
    let { paramsByLocation } = this.requestModel;
    let result = undefined;
    if (nonEmpty(paramsByLocation.body) && format === 'body') {
      let bodyParams = paramsByLocation.body;
      result = JSON.stringify(req[bodyParams[0]]);
    } else if (nonEmpty(paramsByLocation.formData) && format === 'formData') {
      let formParams = paramsByLocation.formData;
      result = '';
      for (let p of formParams) {
        if (0 !== result.length) {
          result += '&';
        }
        result += `${p}=${req[p]}`; // TODO: proper quoting
      }
    } else {
      result = undefined;
      if (format !== 'empty') {
        console.warn(`request format does not match params: ${format}`);
      }
    }

    return result;
  }

//  public headers(req: any): string[][] {
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
    } else if (this.requestModel.paramsByLocation.formData) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    return headers;
    /*
    let result = [];

    for (let h of Object.keys(headers)) {
      result.push([h, headers[h]]);
    }

    return result;
    */
  }

  private _buildParamRenderer() {
    let rqModel = this._requestModel;
    if (
      null == rqModel
      || null == rqModel.paramsType
      || null == rqModel.paramsByLocation
      || null == rqModel.paramsByLocation.query
    ) {
      this._paramRenderers = [];
      return;
    }

    let rqType = rqModel.paramsType as IModelTypeComposite<Req>;

    this._paramRenderers = rqModel.paramsByLocation.query.map(
      function mapName2Renderer (name: string) {
      let pt = rqType.itemType(name);
      if (pt.kind === 'array') {
        let schema = pt.propGet('schema');
        let collectionFormat = schema && schema.collectionFormat;
        switch (collectionFormat) {
          case 'multi': return arrayMultiRenderer(name);
          case 'pipes': return arraySSVRenderer(name, '|');
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

  private _id!: string;
  private _name!: string;
  private _method!: string;
  private _pathPattern!: string;
  private _pathTemplate!: Template;
  private _paramRenderers!: IParamRenderer<Req>[];
  private _requestModel!: IAPIRequestModel<Req>;
  private _responseModel!: IAPIResponseModel<Resp>;
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
    if (!Array.isArray(v)) {
      v = [ v ];
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

export class APIModel extends ClientProps implements IAPIModel, IAPIModelBuilder {

  constructor(
    id: string,
    operations: ReadonlyArray<IAPIOperation<any, any>>, 
    base: string, 
    props?: IClientProps|any
  ) {
    super(props);
    this._id = id;
    this._operations = operations.slice();
    this._base = base;
    this._operationsById = { };
    let opsById = this._operationsById;

    for (let op of this._operations) {
      if (opsById[op.id]) {
        console.warn(`duplicate id for operation ${op.id}: ${opsById[op.id]} ${op}`);
      }
      opsById[op.id] = op;
    }
  }
  get base(): string {
    return this._base;
  }

  get id(): string {
    return this._id;
  }

  operations() {
    return Object.freeze(this._operations);
  }

  operationById(id: string) {
    return this._operationsById[id];
  }

  subModel(keys: string[]) {
    return new APIModel(this.id+`($keys.join(','))`, keys.map(k => this._operationsById[k]), this._base);
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

  private _id: string;
  private _base: string;
  private _operations: IAPIOperation<any, any>[];
  private _operationsById: { [id: string]: IAPIOperation<any, any>; };
}

interface IPathOptions {
  parameters: SwaggerSchema.Parameter[];

  [extensionProp: string]: any;
};

interface ISecurityTypes {
  [schemaName: string]: {
    type: IModelTypeComposite<any>;
  }
}

type IModelLookup = { [id: string]: IAPIModel; };

export class APIModelRegistry implements IAPIModelRegistry {
  constructor(fetchFun?: FetchFun) {
    this._schemas = new ModelSchemaParser();
    this._fetchFun = fetchFun || fetchFetcher;
    this._jsonRefProcessor = new JsonReferenceProcessor(this._fetchFun);
  }

  private parseParameterType(
    opSpec: SwaggerSchema.Operation,
    id: string,
    extraParameters: SwaggerSchema.Parameter[]
  ): IAPIRequestModel<any> {
    let result: IAPIRequestModel<any> = {
      format: "empty",
      locationsByParam: { },
      paramsByLocation: {
        path: [] as string[],
        query: [] as string[],
        body: [] as string[],
        formData: [] as string[],
        header: [] as string[]
      },
      paramsType: new ModelTypeAny('any') //avoid null, this will accept anything
    };
    let parameters = opSpec.parameters as SwaggerSchema.Parameter[];
    if (null == parameters || 0 === parameters.length) {
      return result;
    }
    let composite = new ModelTypeObject<any>(`${id}Params`);
    result.paramsType = composite;
    let locationByParam =  result.locationsByParam;
    let paramsByLocation = result.paramsByLocation;

    parameters.forEach(p => {
      let { name, required } = p;
      let loc = p.in as ParamLocation;
      if (paramsByLocation[loc] == null) {
        paramsByLocation[loc] = [ name ];
      } else {
        paramsByLocation[loc].push(name);
      }
      locationByParam[name] = loc;

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

    let numBodyParams = paramsByLocation.body.length;
    let numFormDataParams = paramsByLocation.formData.length;

    if (1 < numBodyParams) {
      console.warn(`multiple in: body parameters found: ${paramsByLocation.body.join(',')}, ${name}`);
    }
    if (numBodyParams && numFormDataParams) {
      console.warn(`both in: body and in: formData parameters found: ${paramsByLocation.body.join(',')}; ${paramsByLocation.formData.join(',')}‚`);
    }

    if (numBodyParams && !numFormDataParams) {
      result.format = 'body';
    } else if(numFormDataParams && !numBodyParams) {
      result.format = 'formData';
    }

    return result;
  }


  private parseApiKeyType(name: string, aks: SwaggerSchema.ApiKeySecurity): IModelTypeComposite<any> {
    let result = new ModelTypeObject(`security-${name}`);
    result.addItem(aks.name, modelTypes.type('string'), true);
    return result;
  }
  private parseSecurityTypes(spec: SwaggerSchema.Spec) {
    const secDefs = spec.securityDefinitions || { };
    const secDefKeys = Object.keys(secDefs)
    const apiKeyKeys = secDefKeys.filter(x => secDefs[x].type === 'apiKey');

    if (apiKeyKeys.length < secDefKeys.length) {
      const schemes = secDefKeys.map(x => secDefs[x].type).filter(x => x !== 'apiKey');
      console.warn(`ignoring unsupported security schemes: ${schemes.join(', ')}`);
    }
    const secParamTypes = apiKeyKeys.map(k => this.parseApiKeyType(k, secDefs[k] as SwaggerSchema.ApiKeySecurity));
    const secParamDefs = apiKeyKeys.reduce((r,k,i) =>(r[k] = { type: secParamTypes[i] }, r), {} as ISecurityTypes);

    return secParamDefs;
  }

  parseAPIDefinition(specWithRefs: SwaggerSchema.Spec, id: string): IAPIModel {
    let operations = [] as IAPIOperation<any,any>[];
    let currentPathOptions: IPathOptions;

    const spec = new JsonReferenceProcessor().expandDynamic(specWithRefs, id);

    //const secParamDefs = this.parseSecurityTypes(spec);

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

          currentPathOptions = keys.reduce((o:IPathOptions, k:string) => ({...o, k: pathSpec[k]}), {} as IPathOptions);

        } else if (3 == keys.length && isMethod(keys[2])) {

          let opSpec: SwaggerSchema.Operation = x;
          let pathPattern = keys[1];
          let method = keys[2];
          let id = opSpec.operationId || pathPattern+'_'+method;
          let requestModel = this.parseParameterType(opSpec, id, currentPathOptions.parameters);

          if (null != opSpec.security) {
            // console.debug(`found security spec: ${JSON.stringify(opSpec.security)} in ${id}`);
          }

          let responseModel: IAPIResponseModel<any> = { };

          if (null == opSpec.responses) {
            console.warn(`no responses in ${keys.join('.')}`)
          } else {
            for (let status of Object.keys(opSpec.responses)) {
              let typename = `${id}Response${status}`;
              let response = opSpec.responses[status];
              let schema = response && !('$ref' in response) && response.schema;
              if (null != schema) {
                responseModel[status] = this._schemas.addSchemaObject(typename, schema)
              }
            }
          }

          let operation = new Operation({
            id,
            name: id,
            pathPattern, method,
            requestModel,
            responseModel
          });
          operation.propSet('spec', opSpec);
          operations.push(operation);
        }
      }

      return false;
    });

    let base = spec.basePath;

//console.debug(`create APIModel ${operations}, ${base}`)
    let result = new APIModel(id, operations, base, { spec });

    this._modelById[result.id]
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

  private _modelById = { } as IModelLookup;
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

function nonEmpty<T>(array: T[]): boolean {
  return undefined !== array && null !== array && array.length > 0;
}
