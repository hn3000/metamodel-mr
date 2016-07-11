import { JsonPointer } from './json-ptr';
export declare class JsonReference {
    constructor(ref: string);
    static getFilename(ref: string): string;
    readonly filename: string;
    readonly pointer: JsonPointer;
    toString(): string;
    private _filename;
    private _pointer;
}
