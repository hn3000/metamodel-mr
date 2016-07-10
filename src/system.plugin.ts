/* /// <reference path="../typings/index.d.ts" /> */

import { Promise } from "es6-promise";

interface ILocateContext {
  name: string;
  metadata: any;
}

interface IFetchContext extends ILocateContext {
  address: string;
}

interface ITranslateContext extends IFetchContext {
  source:any;
}
interface IInstantiateContext extends ITranslateContext {
  //source is now the translated source
}

interface ICustomLoader {
  /**
   * @param name unnormalized module name
   * @param parentName canonical name of requesting module
   * @param parentAddress address of the requesting module
   * 
   * @return normalized module name
   */
  normalize(name:string, parentName:string, parentAddress:string):string;

  /** 
   * @param load context info
   * @return string address of module
   */
  locate(load:ILocateContext): string;

  /** 
   * @param load context info
   * @return string address of module
   */
  fetch(load:IFetchContext):Promise<any>;

  /** 
   * @param load context info
   * @return string address of module
   */
  translate(load:ITranslateContext):any;

  /** 
   * @param load context info
   * @return string address of module
   */
  instantiate(load:IInstantiateContext);
}