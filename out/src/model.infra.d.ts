import { IMessageProps, IModelParseMessage, IModelParseContext } from "./model.api";
export declare class ModelParseMessage implements IModelParseMessage {
    private _path;
    private _msg;
    private _code;
    private _args;
    private _isError;
    constructor(isError: boolean, path: string, msg: string, code: string, ...args: any[]);
    readonly path: string;
    readonly msg: string;
    readonly code: string;
    readonly args: any[];
    readonly isError: boolean;
}
export declare class ObjectTraversal {
    constructor(obj: any);
    readonly top: any;
    descend(key: string): void;
    ascend(): void;
    private _top;
    private _stack;
    private _keyPath;
}
export declare class ParallelTraversal {
    constructor(obj: any[]);
    readonly top: any[];
    readonly topDefined: any;
    readonly topNonNull: any;
    descend(key: string): void;
    ascend(): void;
    prependTop(t: any): void;
    appendTop(t: any): void;
    _updateTop(obj: any[]): void;
    private _top;
    private _topDefined;
    private _topNonNull;
    private _stack;
}
export declare class ModelParseContext implements IModelParseContext {
    constructor(value: any, required?: boolean, allowConversion?: boolean);
    currentValue(): any;
    currentRequired(): boolean;
    currentKeyPath(): string[];
    pushItem(key: string, required?: boolean): void;
    popItem(): void;
    hasMessagesForCurrentValue(): boolean;
    addMessage(isError: boolean, msg: string, code: string): void;
    addWarning(msg: string, code: string): void;
    addError(msg: string, code: string): void;
    addMessageEx(isError: boolean, msg: string, code: string, props: IMessageProps): void;
    addWarningEx(msg: string, code: string, props: IMessageProps): void;
    addErrorEx(msg: string, code: string, props: IMessageProps): void;
    readonly warnings: IModelParseMessage[];
    readonly errors: IModelParseMessage[];
    readonly allowConversion: boolean;
    private _valueTraversal;
    private _currentRequired;
    private _allowConversion;
    private _requiredStack;
    private _keyPath;
    private _warnings;
    private _errors;
}
