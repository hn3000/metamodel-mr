export declare class JsonPointer {
    static paths(obj: any, pred?: (x: any) => boolean): string[];
    static pointers(obj: any, pred?: (x: any) => boolean): JsonPointer[];
    /**
     * walk obj and pass all values and their paths to the walker function
     *
     * stops decending into sub-objects if the walker returns true
     */
    static walkObject(obj: any, walker: (val: any, p: JsonPointer) => boolean): void;
    static deref(p: string, obj: any): any;
    constructor(ref: string | string[] | JsonPointer, extraUnquoted?: string);
    add(extraUnquoted: string): JsonPointer;
    readonly parent: JsonPointer;
    get(segment: number): string;
    static unquote(s: string): string;
    static quote(s: string): string;
    static _deref(o: any, k: string): any;
    static _set(o: any, k: string, v: any): void;
    getValue(obj: any): any;
    setValue(obj: any, val: any, createPath?: boolean): any;
    deleteValue(obj: any): void;
    asString(): string;
    toString(): string;
    readonly keys: string[];
    private _keypath;
}
