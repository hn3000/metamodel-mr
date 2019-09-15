
import { IAPIClient, IAPIModel, IAPIOperation, IAPIResult, IAPIError, ErrorKind, IHttpHeaders } from './api';

import {
  ModelParseContext,
  IPropertyStatusMessage,
  IStatusMessage
} from '@hn3000/metamodel';

export class APISuccess<TResult> implements IAPIResult<TResult> {
  constructor(private _response:TResult) { }
  isSuccess() { return true; }
  success() { return this._response; }

  error(): Error { return null; }

  response(): any { return this._response; }
}

export class APICallMismatch implements IAPIResult<any> {
  constructor(ctx: ModelParseContext) {
    this._messages = ctx.messages;
    this._error = new Error('parameter validation failed');
    (this._error as any).messages = this._messages;
  }

  isSuccess() { return false; }
  success(): any { return null; }

  error() { return this._error; }
  messages() { return this._messages; }

  response(): any { return null; }

  toString() {
    return this._messages.join(', ');
  }

  private _messages: IPropertyStatusMessage[];
  private _error: Error;
}

export class APIFailure<TResult> implements IAPIResult<TResult> {
  constructor(private _error: Error, private _response: TResult = null) {
  }

  isSuccess() { return false; }
  success(): TResult { return null; }
  error() { return this._error; }
  response(): TResult { return this._response; }
}

export class MetaApiClient implements IAPIClient {
  constructor(apiModel: IAPIModel, baseUrl: string) {
    this._apiModel = apiModel;
    this._baseUrl = baseUrl;
    this._defaults = {};
    this._defaultHeaders = {};
  }

  get model(): IAPIModel { return this._apiModel; }
  get baseUrl(): string { return this._baseUrl; }

  get defaultValues(): any {  return this._defaults; }
  get defaultHeaders(): any {  return this._defaultHeaders; }

  setDefaultValues(values: any): IStatusMessage[] {
    this._defaults = values;
    return [];
  }

  addDefaultValues(values: any): IStatusMessage[] {
    this._defaults = { ...this._defaults, ...values };
    return [];
  }

  setDefaultHeaders(headers: IHttpHeaders): IStatusMessage[] {
    this._defaultHeaders = { ... headers };
    return [];
  }

  addDefaultHeaders(headers: IHttpHeaders): IStatusMessage[] {
    this._defaultHeaders = { ...this._defaultHeaders, ...headers };
    return [];
  }

  /**
   *
   * @param id of the operation
   * @param req
   *
   * @result will reject to an IAPIError in case of errors
   */
  runOperationById(id: string, req: any): Promise<IAPIResult<any>> {
    let operation = this._apiModel.operationById(id);
    if (null == operation) {
      return Promise.reject(<IAPIError>{
        kind: ErrorKind.InvalidOperation,
        httpStatus: null,
        error: null
      });
    }
    return this.runOperation(operation, req);
  }

  /**
   *
   * @param operation
   * @param req
   *
   * @result will reject to an IAPIError in case of errors
   */
  runOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, req: TRequest)
  : Promise<IAPIResult<TResponse>> {

    const ctx = this._verifyRequest(operation, req);
    if (0 != ctx.errors.length) {
      return Promise.resolve(new APICallMismatch(ctx));
    }
    let [url, requestInit] = this.requestInfoForOperation(operation, req);

    return this.runFetch(url, requestInit, operation);
  }

  runFetch<TResponse=any>(
    url: string, 
    requestInit: RequestInit, 
    operation?: IAPIOperation<any, TResponse>
  ) : Promise<IAPIResult<TResponse>> {
    let tmp = fetch(url, requestInit)
      .then((result) => Promise.all([ result, result.text() ]) )
      .then(([result, text]) => [ result, result.headers.get('content-type').startsWith('application/json') && text !== "" ? JSON.parse(text) : {} ]);

    if (null != operation) {
      tmp = tmp.then(([result, json]) => [result, this._verifyResponse(result, json, operation)]);
    }

    let result = tmp.then(([result, json]) => (
        (result.status < 400)
        ? new APISuccess(json as TResponse)
        : new APIFailure(new Error(result.status), json as TResponse)
      ))
      .then(null, (error) => new APIFailure<TResponse>(error));

    return result;
  }

  urlForOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, req: TRequest)
  : string {
    let data = this._requestData(req);
    this._verifyRequest(operation, data);
    return this._urlForOperation(operation, data);
  }
  urlForOperationId(id: string, req: any): string {
    let operation = this._apiModel.operationById(id);
    if (null == operation) {
      return null;
    }
    return this.urlForOperation(operation, req);
  }
  _urlForOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, req: TRequest)
  : string {
    let url = combinePaths(this._baseUrl, this.model.base, operation.path(req)) + operation.query(req);

    return url;
  }

  requestInfoForOperationId(id: string, req: any)
  : [string, RequestInit] 
  {

    let operation = this._apiModel.operationById(id);
    if (null == operation) {
      return null;
    }
    return this.requestInfoForOperation(operation, req);
  }

  requestInfoForOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, req: TRequest)
  : [string, RequestInit] 
  {
    let data = this._requestData(req);
    this._verifyRequest(operation, data);
    return this._requestInfoForOperation(operation, data);
  }
  _requestInfoForOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, req: TRequest)
  : [string, RequestInit] {
    let { method } = operation;

    const url = this._urlForOperation(operation, req);
    let body = operation.body(req);
    const defHeaders = this._defaultHeaders;
    let hasDefaultHeaders = defHeaders != null && 0 != Object.keys(defHeaders).length;
    let headers = hasDefaultHeaders 
                ? { ...defHeaders, ...operation.headers(req) }
                : operation.headers(req);

    let requestInit = {
      body,
      headers,
      method,
      mode: 'cors' as RequestMode
    };

    return [url, requestInit];
  }

  private _verifyRequest<TReq, TResp>(operation: IAPIOperation<TReq, TResp>, req: TReq) {
    let { requestModel } = operation;

    const ctx = new ModelParseContext(req, requestModel.paramsType);
    requestModel.paramsType.validate(ctx);

    if (0 != ctx.messages.length) {
      console.warn(`validation messages for ${operation.id}`, ctx.messages);
    }

    return ctx;
  }

  private _verifyResponse<Req, Resp>(result: Response, json: any, operation: IAPIOperation<Req, Resp>) {
    const resultType = operation.responseModel[result.status];
    if (null == resultType) {
      //console.log(`no result type found for ${operation.method} ${result.url} -> ${result.status}`);
      return json;
    }
    const ctx = new ModelParseContext(json, json);
    resultType.validate(ctx);
    if (ctx.messages.length) {
      let error = new Error('invalid response received');
      (error as any)['validation'] = ctx;
      (error as any)['messages'] = ctx.messages;
      throw error;
    } else {
      console.log(`validated response (successfully) from ${result.url}`);
    }
    return json;
  }

  private _requestData(req: any): any {
    let defaults = this._defaults;
    let hasDefaults = null != defaults && 0 != Object.keys(defaults).length;
    let data = hasDefaults ? { ...defaults, ...req } : req;

    return data;
  }
  private _apiModel: IAPIModel;

  private _baseUrl: string;

  private _defaults: any;
  private _defaultHeaders: any;
}

function combinePaths(...paths: string[]) {
  return paths.reduce(combine2Paths);
}

function combine2Paths(a: string, b: string) {
  const aHasSlash = a.endsWith('/');
  const bHasSlash = b.startsWith('/');
  if (aHasSlash !== bHasSlash) {
    return a+b;
  } else if (aHasSlash) {
    return a + b.substr(1);
  } else {
    return a + '/' + b;
  }
}
