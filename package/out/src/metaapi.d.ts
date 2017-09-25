import { IAPIModel, IAPIModelBuilder, IAPIModelRegistry, IAPIOperation, IAPIRequestModel } from './api';
import * as SwaggerSchema from 'swagger-schema-official';
export declare type FetchFun = (url: string) => Promise<string>;
export declare class APIModel implements IAPIModel, IAPIModelBuilder {
    constructor(operations: ReadonlyArray<IAPIOperation<any, any>>, base: string);
    readonly base: string;
    operations(): ReadonlyArray<IAPIOperation<any, any>>;
    operationById(id: string): IAPIOperation<any, any>;
    subModel(keys: string[]): APIModel;
    add(op: IAPIOperation<any, any>): this;
    remove(id: string): this;
    setBase(base: string): void;
    private _base;
    private _operations;
    private _operationsById;
}
export declare class APIModelRegistry implements IAPIModelRegistry {
    constructor(fetchFun?: FetchFun);
    parseParameterType(opSpec: SwaggerSchema.Operation, id: string): IAPIRequestModel<any>;
    parseAPIDefinition(spec: SwaggerSchema.Spec, id: string): IAPIModel;
    fetchModel(url: string, id: string): Promise<IAPIModel>;
    model(id: string): IAPIModel;
    private _modelById;
    private _schemas;
    private _jsonRefProcessor;
    private _fetchFun;
}
