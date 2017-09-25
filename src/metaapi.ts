
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

import { TemplateFactory } from '@hn3000/simpletemplate';

import * as SwaggerSchema from 'swagger-schema-official';

import * as fetch from 'isomorphic-fetch';

export type FetchFun = (url:string) => Promise<string>;

const templateFactory = new TemplateFactory({ pattern: '{X}'});

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

export class APIModelRegistry implements IAPIModelRegistry {
  constructor(fetchFun?: FetchFun) {
    this._schemas = new ModelSchemaParser();
    this._fetchFun = fetchFun || fetchFetcher;
    this._jsonRefProcessor = new JsonReferenceProcessor(this._fetchFun);
  }

  parseParameterType(opSpec: SwaggerSchema.Operation, id: string): IAPIRequestModel<any> {
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
        type = this._schemas.itemType(pp.type);
      }
      if (type != null) {
        composite.addItem(name, type, required);
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

    JsonPointer.walkObject(spec, (x,p) => {
      let keys = p.keys;
      if (keys.length < 1) {
        return true;
      }
      if ('paths' === keys[0]) {
        if (3 < keys.length) {
          return true;
        }
        if (3 == keys.length) {
          let opSpec: SwaggerSchema.Operation = x;
          let pathPattern = keys[1];
          let method = keys[2];
          let id = opSpec.operationId || pathPattern+'_'+method;
          let requestModel = this.parseParameterType(opSpec, id);

          let responseModel: IAPIResponseModel<any> = {
            '200': this._schemas.type('any')
          };

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

          let pathTemplate = templateFactory.parse(pathPattern);

          operations.push({
            id,
            name: id,
            pathPattern, method,
            requestModel,
            responseModel,
            path: pathTemplate.render.bind(pathTemplate)
          });
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
