export declare class JsonPointer {
    constructor(ref: string);
    static unquote(s: string): string;
    static quote(s: string): string;
    static deref(o: any, k: string): any;
    getValue(obj: any): any;
    asString(): string;
    toString(): string;
    readonly keys: string[];
    private _keypath;
}
