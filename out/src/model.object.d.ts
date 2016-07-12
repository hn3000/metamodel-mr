import { IModelType, IModelTypeItem, IModelTypeCompositeBuilder, IModelTypeEntry, IModelTypeComposite, IModelParseContext } from "./model.api";
import { ModelTypeConstrainable, ModelConstraints, ModelTypeConstraintOptional } from "./model.base";
export declare class ModelTypeObject<T> extends ModelTypeConstrainable<T> implements IModelTypeCompositeBuilder<T> {
    private _constructFun;
    private _entries;
    private _entriesByName;
    constructor(name: string, construct?: () => T, constraints?: ModelConstraints<T>);
    protected _clone(constraints: ModelConstraints<T>): this;
    asItemType(): IModelTypeItem<T>;
    addItem(key: string, type: IModelType<any>, required?: boolean): IModelTypeCompositeBuilder<T>;
    subModel(name: string | number): IModelType<any>;
    slice(names: string[] | number[]): IModelTypeComposite<T>;
    extend<X>(type: IModelTypeComposite<X>): IModelTypeCompositeBuilder<T>;
    readonly items: IModelTypeEntry[];
    parse(ctx: IModelParseContext): T;
    validate(ctx: IModelParseContext): void;
    unparse(value: T): any;
    create(): T;
    protected _kind(): string;
}
export interface IEqualPropertiesConstraintOptions {
    properties: string | string[];
}
export declare class ModelTypeConstraintEqualProperties extends ModelTypeConstraintOptional<any> {
    constructor(fieldsOrSelf: string[] | IEqualPropertiesConstraintOptions | ModelTypeConstraintEqualProperties);
    private _isConstraintEqualFields();
    protected _id(): string;
    checkAndAdjustValue(val: any, ctx: IModelParseContext): Date;
    private _fields;
}
export interface IConditionOptions {
    property: string;
    value: string | string[] | number | number[];
    op?: "=";
}
export interface IConditionalValueConstraintOptions {
    condition: IConditionOptions;
    properties: string | string[];
    possibleValue?: string | number | string[] | number[];
}
export interface IConditionalValueConstraintSettings {
    id: string;
    predicate: (x: any) => boolean;
    valueCheck: (x: any) => boolean;
    properties: string[];
    possibleValues: any[];
}
export declare class ModelTypeConstraintConditionalValue extends ModelTypeConstraintOptional<any> {
    constructor(optionsOrSelf: IConditionalValueConstraintOptions | ModelTypeConstraintConditionalValue);
    private _isConstraintConditionalValue();
    protected _id(): string;
    checkAndAdjustValue(val: any, ctx: IModelParseContext): Date;
    private _settings;
}
