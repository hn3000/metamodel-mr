/// <reference types="es6-promise" />
import { JsonReference } from './json-ref';
export interface Fetcher {
    (url: string, base?: string): Promise<string>;
}
export declare class JsonReferenceProcessor {
    constructor(fetch?: Fetcher);
    fetchRef(url: string, base?: string): Promise<any>;
    expandRef(url: string): Promise<any>;
    expandDynamic(obj: any, ref: JsonReference | string): any;
    _expandRefs(url: string, base?: string): any;
    _expandDynamic(obj: any, filename: string, base?: string, keypath?: string[]): any;
    visitRefs(x: any, visitor: (r: string, e: any, p: string[]) => void): void;
    findRefs(x: any): string[];
    _fetchContent(urlArg: string, base?: string): Promise<any>;
    _adjustUrl(url: string, base?: string): string;
    private _adjusterCache;
    _urlAdjuster(base: string): (x: string) => string;
    _fetchRefs(x: any, base: string): Promise<any[]>;
    _fetchRefsAll(files: string[], x: any[]): Promise<any[]>;
    private _fetch;
    private _cache;
    private _contents;
}
export declare function jsonParse(x: string): any;
export declare enum CommentKind {
    NONE = 0,
    SINGLELINE = 1,
    MULTILINE = 2,
    BOTH = 3,
}
export declare function removeComments(jsonString: string, kinds?: CommentKind): string;
export declare function normalizePath(path: string): string;
