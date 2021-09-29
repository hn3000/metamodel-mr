
import { 
  IAPIClient, 
  IAPIModel, 
  IAPIOperation, 
  IAPIResult, 
  IHttpHeaders, 
  IAPIRequestContext
} from './api';

import {
  ModelParseContext,
  IPropertyStatusMessage,
  IStatusMessage,
} from '@hn3000/metamodel';

import { combinePaths } from './path-utils';

export class APISuccess<TResult> implements IAPIResult<TResult> {
  constructor(
    private _response: TResult,
    private _requestContext: IAPIRequestContext<any, TResult>,
    private _httpRequest: Request,
    private _httpResponse: Response
  ) { }
  isSuccess() { return true; }
  success() { return this._response; }
  error() { return undefined; }
  response() { return this._response; }

  requestContext() { return this._requestContext; }
  httpRequest(): Request { return this._httpRequest; }
  httpResponse(): Response { return this._httpResponse; } 
}

export class APICallMismatch implements IAPIResult<any> {
  constructor(ctx: ModelParseContext, requestContext: IAPIRequestContext<any, any>) {
    this._messages = ctx.messages;
    this._error = new Error('parameter validation failed');
    (this._error as any).messages = this._messages;

    this._requestContext = requestContext;
  }

  isSuccess() { return false; }
  success(): any { return null; }

  error() { return this._error; }
  messages() { return this._messages; }
  
  response(): any { return null; }
  requestContext() { return this._requestContext; }
  
  toString() {
    return this._messages.join(', ');
  }
  
  private _messages: IPropertyStatusMessage[];
  private _error: Error;

  private _requestContext: IAPIRequestContext<any, any>;
}

export class APIFailure<TResult> implements IAPIResult<TResult> {
  constructor(
    private _error: Error, 
    private _response: TResult|undefined = undefined,
    private _requestContext: IAPIRequestContext<any, TResult>,
    private _httpRequest?: Request,
    private _httpResponse?: Response
  ) { }

  isSuccess() { return false; }
  success(): undefined { return undefined; }
  error() { return this._error; }
  response() { return this._response; }
  requestContext() { return this._requestContext; }
  httpRequest() { return this._httpRequest; }
  httpResponse() { return this._httpResponse; } 
}

export class MetaApiClient implements IAPIClient {
  constructor(apiModel: IAPIModel, baseUrl: string) {
    this._apiModel = apiModel;
    this._baseUrl = baseUrl;
    this._defaults = {};
    this._defaultHeaders = {};
    this._verbose = false;
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
      return Promise.reject(new Error(`Operation ${id} not found.`));
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

    const requestContext: IAPIRequestContext<TRequest, TResponse> = {
      operation,
      requestData: req
    }
 

    const ctx = this._verifyRequest(operation, req);
    if (0 != ctx.errors.length) {
      return Promise.resolve(new APICallMismatch(ctx, requestContext));
    }
    let [url, requestInit] = this.requestInfoForOperation(operation, req);

    return this._runFetch(url, requestInit, requestContext);
  }

  async _runFetch<TResponse=any>(
    url: string, 
    requestInit: RequestInit, 
    requestContext: IAPIRequestContext<any, TResponse>
  ) : Promise<IAPIResult<TResponse>> {
    const httpRequest = new Request(url, requestInit);

    const httpResponse = await fetch(httpRequest);

    let text = await httpResponse.text();
    const isJSON = httpResponse.headers.get('content-type')?.startsWith('application/json');

    let result: IAPIResult<TResponse>;
    let json: any = {};
    try {
      if (isJSON && text !== '') {
        json = JSON.parse(text);
      }
      if (null != requestContext?.operation) {
        this._verifyResponse(httpResponse, json, requestContext.operation);
      }

      if (httpResponse.status < 400) {
        result = new APISuccess(json as TResponse, requestContext, httpRequest, httpResponse);
      } else {
        result = new APIFailure(
          new Error(''+httpResponse.status), 
          json as TResponse, 
          requestContext, httpRequest, httpResponse
        );
      }
    } catch (error) {
      result = new APIFailure<TResponse>(error, json, requestContext, httpRequest, httpResponse);
    }


    return result;
  }

  urlForOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, req: TRequest)
  : string {
    let data = this._requestData(req);
    this._verifyRequest(operation, data);
    return this._urlForOperation(operation, data);
  }
  urlForOperationId(id: string, req: any): string | undefined {
    let operation = this._apiModel.operationById(id);
    if (null == operation) {
      return undefined;
    }
    return this.urlForOperation(operation, req);
  }
  _urlForOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, req: TRequest)
  : string {
    let url = combinePaths(this._baseUrl, this.model.base, operation.path(req)) + operation.query(req);

    return url;
  }

  requestInfoForOperationId(id: string, req: any)
  : [string, RequestInit] | undefined
  {

    let operation = this._apiModel.operationById(id);
    if (null == operation) {
      return undefined;
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
      if (this._verbose) {
        console.info(`validated response (successfully) from ${result.url}`);
      }
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

  private _verbose: boolean;
}

