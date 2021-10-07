/* /// <reference path="../typings/index.d.ts" /> */

export interface ILoaderMetadata {
  [key:string]:any;
  sourceMap?:any; // can carry a sourcemap
}

export interface ILocateContext {
  name?: string;
  metadata: any;
}

export interface IFetchContext extends ILocateContext {
  address?: string;
}

export interface ITranslateContext extends IFetchContext {
  source:any;
}
export interface IInstantiateContext extends ITranslateContext {
  //source is now the translated source
}

export interface ICustomLoader {
  /**
   * @param name unnormalized module name
   * @param parentName canonical name of requesting module
   * @param parentAddress address of the requesting module
   * 
   * @return normalized module name
   */
  normalize?(name:string, parentName:string, parentAddress:string):string;

  /** 
   * @param load context info
   * @return string address of module
   */
  locate?(load:ILocateContext): string;

  /** 
   * @param load context info
   * @return string address of module
   */
  fetch?(load:IFetchContext):Promise<any>;

  /** 
   * @param load context info
   * @return string address of module
   */
  translate?(load:ITranslateContext):any;

  /** 
   * @param load context info
   * @return string address of module
   */
  instantiate?(load:IInstantiateContext):any;
}