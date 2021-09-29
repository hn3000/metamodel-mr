
import {
  ILoaderMetadata,
  ILocateContext,
  IFetchContext,
  ITranslateContext,
  IInstantiateContext,
  ICustomLoader
} from './loader.plugin.api';

import { JsonReferenceProcessor } from '@hn3000/json-ref';
import  * as fetch from 'isomorphic-fetch';

export var jsonSchemaLoader: ICustomLoader = {
  fetch(load: IFetchContext) {
    //console.log("fetch", load);
    var processor = new JsonReferenceProcessor(fetcher);

    return processor.expandRef(load.address).then(x => {
      return JSON.stringify(x); 
    });
  },

  instantiate(load:IInstantiateContext) {
    //console.log("instantiate", load);
    return JSON.parse(load.source);
  }
}

export default jsonSchemaLoader;

function fetcher (url:string) : Promise<string> {
  let promise = fetch(url); 
  return promise.then((response) => response.text());
}

//console.log("jsonschema loader created");
