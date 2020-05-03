
import { IModelType, IModelTypeComposite, IClientProps, IStatusMessage } from '@hn3000/metamodel';

export type ParamLocation = 'path' | 'query' | 'header' | 'formData' | 'body';

export interface IAPIRequestModel<T> {
  paramsType: IModelTypeComposite<T> | IModelType<T>;
  format: "formData" | "body" | "empty";

  paramsByLocation: { [location in ParamLocation]: string[]; };

  locationsByParam: { [param: string]: ParamLocation; };
}

export interface IAPIResponseModel<T> {
  [status: string]: IModelTypeComposite<T> | IModelType<T>;
  //'200': IModelTypeComposite<T> | IModelType<T>;
}

export type TokenLocation = 'query' | 'header';

export interface IAPITokenModel {
  location: TokenLocation;
  name: string;
}

export interface IAPIOperation<Req, Resp> extends IClientProps {
  readonly name: string;
  readonly id: string;
  readonly pathPattern: string;
  readonly method: string;

  readonly requestModel: IAPIRequestModel<Req>;
  readonly responseModel: IAPIResponseModel<Resp>;
  path: (req: any) => string; // replaces path parameters

  query: (req: any) => string; // returns query parameters
  headers(req: any): { [key: string]: string };
  body(req: any): string;

}

export type IAPIOperationInit<Request,Response> = 
  & Pick<IAPIOperation<Request,Response>, 'id'|'pathPattern'|'method'|'requestModel'|'responseModel'> 
  & Partial<IAPIOperation<Request,Response>>
  ;

export interface IAPIModel extends IClientProps {
  operations(): ReadonlyArray<IAPIOperation<any, any>>;
  operationById(id:string): IAPIOperation<any, any>;
  readonly base: string;
  readonly id: string;

  subModel(ids: string[]): IAPIModel;
}

export interface IAPIModelBuilder extends IAPIModel {
  add(op: IAPIOperation<any, any>): IAPIModelBuilder;
  remove(id: string): IAPIModelBuilder;
  setBase(base: string): void;
}

export interface IAPIModelRegistry {
  fetchModel(url: string, id: string): Promise<IAPIModel>;
  model(id: string): IAPIModel;
}

export interface IAPIRequestContext<TReq, TResp> {

  operation: IAPIOperation<TReq, TResp>;

  requestData: TReq;
}

export interface IAPIResult<TResponse> {
  isSuccess(): boolean;
  success(): TResponse | undefined;
  error(): Error | undefined;

  response(): any; // Success in this case

  requestContext(): IAPIRequestContext<any, TResponse>;


}

export enum ErrorKind {
  InvalidOperation,
  Failure,
  Success
}

export interface IAPIError {
  kind: ErrorKind;
  httpStatus: number;
  error: any;
}

export interface IHttpHeaders { 
  [name:string]: string; 
}

export interface IAPIClient {

  runOperationById(id: string, requestData: any): Promise<IAPIResult<any>>; // will reject to an IAPIError in case of errors

  runOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, requestData: TRequest): Promise<IAPIResult<TResponse>>; // will reject to an IAPIError in case of errors

  urlForOperationId(id: string, requestData: any): string | undefined;
  urlForOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, requestData: TRequest): string;
  requestInfoForOperationId(id: string, requestData: any): [string, RequestInit] | undefined;
  requestInfoForOperation<TRequest, TResponse>(operation: IAPIOperation<TRequest, TResponse>, requestData: TRequest): [string, RequestInit];

  model: IAPIModel;

  baseUrl: string;

  readonly defaultValues: any;

  readonly defaultHeaders: IHttpHeaders;

  addDefaultValues(values: any): IStatusMessage[]; 

  setDefaultValues(values: any): IStatusMessage[]; 

  addDefaultHeaders(headers: IHttpHeaders): IStatusMessage[];
  
  setDefaultHeaders(headers: IHttpHeaders): IStatusMessage[];

}
