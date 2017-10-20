
import { IAPIClient, IAPIModel, IAPIOperation, IAPIResult, IAPIError, ErrorKind } from './api';

import {
  ModelParseContext,
  IPropertyStatusMessage
} from '@hn3000/metamodel';

export class APISuccess<TResult> implements IAPIResult<TResult> {
  constructor(public result:TResult) { }
  isSuccess() { return true; }
  success() { return this.result; }

  error(): Error { return null; }
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

  toString() {
    return this._messages
  }

  private _messages: IPropertyStatusMessage[];
  private _error: Error;
}

export class APIFailure implements IAPIResult<any> {
  constructor(error: Error) {
    this._error = error;
  }

  isSuccess() { return false; }
  success(): any { return null; }
  error() { return this._error; }

  private _error: Error;
}

export class MetaApiClient implements IAPIClient {
  constructor(apiModel: IAPIModel, baseUrl: string) {
    this._apiModel = apiModel;
    this._baseUrl = baseUrl;
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
    let { method, requestModel } = operation;

    const ctx = new ModelParseContext(req, requestModel.paramsType);
    requestModel.paramsType.validate(ctx);

    if (ctx.hasMessagesForCurrentValue()) {
      return Promise.resolve(new APICallMismatch(ctx));
    }

    let url = this._baseUrl + operation.path(req) + operation.query(req);
    let body = operation.body(req);
    let headers = operation.headers(req);
    //let body = this._body(operation, req);
    //let headers = this._headers(operation, req);

    return (
      fetch(url, { headers, body, method })
      .then((result) => Promise.all([result, result.json()]))
      .then(([result, json]) => this._verify(result, json, operation))
      .then((json) => (new APISuccess(json as TResponse)))
      .then(null, (error) => new APIFailure(error))
    );
  }

  private _verify<Req, Resp>(result: Response, json: any, operation: IAPIOperation<Req, Resp>) {
    const resultType = operation.responseModel[result.status];
    const ctx = new ModelParseContext(json, json);
    resultType.validate(ctx);
    if (ctx.messages.length) {
      let error = new Error('invalid response received');
      (error as any)['validation'] = ctx;
      (error as any)['messages'] = ctx.messages;
      throw error;
    } else {
      console.log("", result);
    }
    return json;
  }
  private _apiModel: IAPIModel;

  private _baseUrl: string;
}