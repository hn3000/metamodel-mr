
import { JsonReferenceProcessor } from '@hn3000/json-ref';
import  { Promise } from 'es6-promise';
import  * as fetch from 'isomorphic-fetch';
import  { Response } from 'isomorphic-fetch';
var fs = require('fs');

interface ILoaderContext {
  version:number;
  context: string;
  request: string;
  query: string;
  data: any;
  cacheable: boolean;
  loaders:any[];
  loaderIndex: number;
  resource: string;
  resourcePath: string;
  resourceQuery: string;
  emitWarning(message:string):void;
  emitError(message:string):void;
  exec(code:string, filename:string):void;
  resolve(context:string, request:string, callback: (err:any, result:string)=>void):void;
  resolveSync(context:string, request:string):string;
  addDependency(file:string):void;
  dependency(file:string):void;
  addContextDependency(directory:string):void;
  clearDependencies():void;
  async():(err:any, result?:string)=>void;
  value:any;
  inputValue:any;
  options:any;
  debug:boolean;
  minimize:boolean;
  sourceMap:boolean;
  target: "web" | "node" | string;
  webpack:boolean;
  emitFile(name:string, content: /*Buffer*/any|string, sourceMap:any):void;
  _compilation:any;
  _compiler:any;
}

export function jsonReferenceLoader(content:string) {
  let ctx:ILoaderContext = (this as any);
  let callback = ctx.async();

  if (null == callback) {
    ctx.emitError('jsonschema loader can not work synchronously, sorry');
  }
  //ctx.emitError(`loading json ref: ${ctx.resource} ${content.substring(0,30)}`);

  let processor = new JsonReferenceProcessor(fetcher.bind(null, ctx));
  processor.expandRef(ctx.resource).then(x => {
    let result = `module.exports=${JSON.stringify(x)};`;
    callback(null, result); 
  }, err => {
    callback(err); 
  });
}

function fetcher(ctx:ILoaderContext, x:string):Promise<string> {
  //console.error("reading ", x);
  //ctx.emitError(`loading json ref: ${x} ${ctx.resource}`);
  if (x == "") {
    let err = new Error("empty filename");
    //console.error(err);
    throw err;
  }
  if (0 == x.lastIndexOf('http://',8) || 0 == x.lastIndexOf('https://',8)) {
    return fetch(x, { method: 'GET' }).then(response => response.text());
  }
  return Promise.resolve().then(()=>{
    let contents = fs.readFileSync(x,'utf-8');
    if ('\uFEFF' === contents.charAt(0)) {
      return contents.substr(1);
    }
    return contents;
  });
}

module.exports = jsonReferenceLoader;
