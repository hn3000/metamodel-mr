
import { JsonPointer } from './json-ptr';
import { JsonReference } from './json-ref';

export interface Fetcher {
  (url:string, base?:string): Promise<string>;
}

export class JsonReferenceProcessor {
  constructor(fetch?:Fetcher) {
    this._fetch = fetch;
    this._cache = {};
    this._contents = {};
  }

  fetchRef(url:string, base?:string):Promise<any> {
    let ref = new JsonReference(url);
    var contentPromise = this._fetchContent(ref.filename, base);
    return contentPromise
      .then((x)=>{
        //console.log("fetching refs for ", x, ref.filename);
        return this._fetchRefs(x,ref.filename).then(()=>x);
      });
  }

  expandRef(url:string):Promise<any> {
    return this.fetchRef(url)
      .then((x:any) => {
        // at this point all referenced files should be in _cache
        //console.log("expanding refs for ", x, ref.filename);
        return this._expandRefs(url);
      });
  }

  expandRefs(json: any, baseUrl: string): Promise<any> {
    if (null == this._cache[baseUrl]) {
      this._contents[baseUrl] = json;
      this._cache[baseUrl] = Promise.resolve(json);
    }
    return this._fetchRefs(json, baseUrl)
      .then((x:any) => {
        // at this point all referenced files should be in _cache
        //console.log("expanding refs for ", x, ref.filename);
        return this._expandRefs(baseUrl);
      });
  }

  expandDynamic(obj:any, ref: JsonReference|string): any {
    let base = JsonReference.get(ref);
    if (null == this._cache[base.filename]) {
      const hasPointer = base.pointer.hasParent()
      let baseObj = hasPointer ? {} : obj;
      if (hasPointer) {
        base.pointer.setValue(baseObj, obj, true);
      }
      this._contents[base.filename] = baseObj;
      this._cache[base.filename] = Promise.resolve(baseObj);
    }
    return this._expandDynamic(obj, base.toString());
  }

  _expandRefs(url:string, base?:string):any {
    let ref = new JsonReference(url);

    let filename = this._adjustUrl(ref.filename, base);
    if (!filename) {
      throw new Error('invalid reference: no file');
    }
    if (!this._contents.hasOwnProperty(filename)) {
      throw new Error(`file not found in cache: ${filename}`);
    }

    let json = this._expandDynamic(this._contents[filename], filename);
    let obj = ref.pointer.getValue(json);

    if (null != obj && typeof obj === 'object') {
      return obj;
    }

    if (null == obj) {
      return {
        "$$ref": ref.toString(),
        "$$filenotfound": json == null,
        "$$refnotfound": obj == null
      };
    }

    return obj;
  }

  _expandDynamic(obj:any, filename:string, base?:string, keypath:string[]=[]) {
    var url = this._adjustUrl(filename, base);
    if (obj && obj.hasOwnProperty && obj.hasOwnProperty("$ref")) {
      return this._expandRefs(obj["$ref"], url);
    } else {
      if (null == obj) {
        var error:Error = null;
        try { throw new Error("here is a stacktrace"); }
        catch (xx) {
          error = xx;
        }
        //console.error("expanding undefined? ", obj, url+'#/'+keypath.join('/'), error.stack);
      }
    }

    var result = obj;
    if (null != obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        result = (<any[]>obj).map((x,ix)=>this._expandDynamic(x, url, null, [...keypath, ''+ix]));
      } else {
        result = {};
        var keys = Object.keys(obj);
        for (var k of keys) {
          //console.log("define property", k, result);
          Object.defineProperty(
            result,
            k,
            {
              enumerable: true,
              get: ((obj:any,k:string)=>this._expandDynamic(obj[k], url,null,[...keypath,k])).bind(this,obj,k)
            }
          );
        }
      }
    }
    return result;
  }

  visitRefs(x:any, visitor:(r:string, e:any, p:string[])=>void) {
    var queue:{e:any, p:string[]}[] = [];
    //console.log('findRefs',x);
    if (x != null) {
      queue.push({e:x, p:[]});
    }

    while (0 != queue.length) {
      var thisOne = queue.shift();
      var ref = thisOne.e["$ref"];
      if (null != ref) {
        visitor(thisOne.e.$ref, thisOne.e, thisOne.p);
      } else if (typeof thisOne.e === 'object') {
        var keys = Object.keys(thisOne.e);
        for (var k of keys) {
          if (thisOne.e[k]) {
            queue.push({ e: thisOne.e[k], p:thisOne.p.concat([k])});
          }
        }
      }
    }
  }

  findRefs(x:any) {
    var result:string[] = [];
    this.visitRefs(x, (r, e, p) => result.push(r));

    //console.log('findRefs done', x, result);

    return result;
  }

  _fetchContent(urlArg:string, base?:string):Promise<any> {
    var url = this._adjustUrl(urlArg, base);
    if (this._cache.hasOwnProperty(url)) {
      return this._cache[url];
    }
    let result = Promise.resolve(url)
      .then(u => this._fetch(u))
      .then((x)=> (typeof x === 'string') ? jsonParse(x, url) : x)
      .then(
        (x) => (this._contents[url]=x, x),
        (err) => (this._contents[url]=null,null)
      );
  
    this._cache[url] = result;

    return result;
  }

  _adjustUrl(url:string, base?:string) {
    return this._urlAdjuster(base)(url);
  }

  private _adjusterCache:{ [base:string]:(x:string)=>string} = {};

  _urlAdjuster(base:string): (x:string)=>string {
    if (null != base) {
      let hashPos = base.indexOf('#');
      let theBase = (hashPos === -1) ? base : base.substring(0, hashPos);

      theBase = normalizePath(theBase);

      if (null != this._adjusterCache[theBase]) {
        return this._adjusterCache[theBase];
      }

      let slashPos = theBase.lastIndexOf('/');
      if (-1 == slashPos) {
        slashPos = theBase.lastIndexOf('\\');
      }
      let result: (x:string)=>string = null;
      if (-1 != slashPos) {
        let prefix = theBase.substring(0, slashPos+1);
        result = (x:string) => {
          if (null == x || x === "") {
            return theBase;
          }
          if ('/' === x.substring(0,1)) {
            return x;
          }
          //console.error("urlAdjuster", x, base, '->',prefix+x);
          /*if (base === x) {
            console.error("base == url", new Error());
          }*/
          return normalizePath(prefix + x);
        };
      } else {
        result = (x) => {
          if (null == x || x === "") {
            return theBase;
          }
          return x;
        };
      }

      this._adjusterCache[theBase] = result;

      return result;
    }
    return (x) => x;
  }

  _fetchRefs(x:any, base:string):Promise<any[]> {
    var adjuster = this._urlAdjuster(base);
    var refs = this.findRefs(x);
    //console.log("found refs ", refs);

    var files = refs.map(x => adjuster(JsonReference.getFilename(x)));
    var filesHash:any = files.reduce((c:any,f:string) => { c[f] = f; return c; }, {});
    files = Object.keys(filesHash);
    //console.log("found files ", refs, files, " fetching ...");

    var needThen = files.some((p) => !this._contents.hasOwnProperty(p));

    var filesPromises = files.map((p) => this._fetchContent(p));

    //console.log("got promises ", filesPromises);

    var promise = Promise.all(filesPromises);

    if (needThen) {
      return promise.then(this._fetchRefsAll.bind(this, files));
    }

    return promise;
  }

  _fetchRefsAll(files:string[], x:any[]) {
    var result:Promise<any>[] = [];
    for (var i=0, n=x.length; i<n; ++i) {
      result.push(this._fetchRefs(x[i], files[i]));
    }
    return Promise.all(result);
  }

  private _fetch:Fetcher;
  private _cache:{[k:string]:Promise<any>};
  private _contents:{[k:string]:any};
}

export function jsonParse(x: string, url?: string): any {
  let result: any;
  try {
    result = JSON.parse(x);
  } catch (xx) {
    try {
      let nocomments = removeComments(x);
      result = JSON.parse(nocomments);
    } catch (xxx) {
      console.log(`attempt to remove comments ${url ? ('from '+url) : ''} failed, exceptions before / after were: `, xx, xxx);
    }
  }

  return result;
}

const singleLineCommentRE = /\/\/.*$/gm;
const multiLineCommentRE = /\/\*(.|[\r\n])*?\*\//g;

export enum CommentKind {
  NONE       = 0,
  SINGLELINE = 1,
  MULTILINE  = 2,
  BOTH       = SINGLELINE | MULTILINE
}

export function removeComments(jsonString:string, kinds = CommentKind.BOTH): string {
  let result = jsonString;

  if (kinds & CommentKind.SINGLELINE) {
    result = result.replace(singleLineCommentRE, '');
  }
  if (kinds & CommentKind.MULTILINE) {
    result = result.replace(multiLineCommentRE, '');
  }

  return result;
}

const redundantDotRE = /[/][.][/]/g;
const redundantDotDotRE = /(^|[/])[^/.]+[/][.][.][/]/g;

export function normalizePath(path: string) {
  let result = replaceWhileFound(path, redundantDotRE, '/');
  result = replaceWhileFound(result, redundantDotDotRE, '/');

  return result;
}

function replaceWhileFound(input: string, re: RegExp, replacement: string) {
  let result = input;

  let done = false;
  while (!done) {
    let replaced = result.replace(re, replacement);
    if (replaced === result) {
      done = true;
    }
    result = replaced;
  }
  return result;
}