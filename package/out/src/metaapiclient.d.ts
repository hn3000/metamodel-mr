import { IAPIClient, IAPIModel, IAPIOperation, IAPIResult } from './api';
import { ModelParseContext, IPropertyStatusMessage } from '@hn3000/metamodel';
export declare class APISuccess<TResult> implements IAPIResult<TResult> {
    result: TResult;
    constructor(result: TResult);
    isSuccess(): boolean;
    success(): TResult;
    error(): Error;
}
export declare class APICallMismatch implements IAPIResult<any> {
    constructor(ctx: ModelParseContext);
    isSuccess(): boolean;
    success(): any;
    error(): Error;
    messages(): IPropertyStatusMessage[];
    toString(): IPropertyStatusMessage[];
    private _messages;
    private _error;
}
export declare class APIFailure implements IAPIResult<any> {
    constructor(error: Error);
    isSuccess(): boolean;
    success(): any;
    error(): Error;
    private _error;
}
export declare class MetaApiClient implements IAPIClient {
    constructor(apiModel: IAPIModel, baseUrl: string);
    /**
     *
     * @param id of the operation
     * @param req
     *
     * @result will reject to an IAPIError in case of errors
     */
    runOperationById(id: string, req: any): Promise<IAPIResult<any>>;
    /**
     *
     * @param operation
     * @param req
     *
     * @result will reject to an IAPIError in case of errors
     */
    runOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, req: TRequest): Promise<IAPIResult<TResponse>>;
    private _verify<Req, Resp>(result, json, operation);
    private _body<Req, Resp>(operation, req);
    private _headers<Req, Resp>(operation, req);
    private _apiModel;
    private _baseUrl;
}
