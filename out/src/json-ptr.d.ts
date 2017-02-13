export declare class JsonPointer {
    constructor(ref: string | string[] | JsonPointer, extraUnquoted?: string);
    add(extraUnquoted: string): JsonPointer;
    readonly parent: JsonPointer;
    get(segment: number): string;
    readonly segments: string[];
    static unquote(s: string): string;
    static quote(s: string): string;
    static deref(o: any, k: string): any;
    getValue(obj: any): any;
    setValue(obj: any, val: any, createPath?: boolean): any;
    deleteValue(obj: any): void;
    asString(): string;
    toString(): string;
    readonly keys: string[];
    private _keypath;
}
