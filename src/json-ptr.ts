
/* /// <reference path="../typings/index.d.ts" /> */

function isSimpleObj(val:any) {
  return (
    (val instanceof Date)
    || (val instanceof String)
    || (val instanceof RegExp)
  );
}

function maybeArrayIndex(val: string) {
  if ('-' == val) return true;
  let n = parseFloat(val);
  return !(isNaN(n) || Math.floor(n) !== n);
}

export class JsonPointer {
  public static paths(obj: any, pred?: (x:any) => boolean): string[] {
    let result:string[] = [];

    if (typeof pred === 'function') {
      JsonPointer.walkObject(obj, (v, p) => (pred(v) && result.push(p.toString()), false));
    } else {
      JsonPointer.walkObject(obj, (_, p) => (result.push(p.toString()), false));
    }

    return result;
  }

  public static pointers(obj: any, pred?: (x:any) => boolean): JsonPointer[] {
    let result:JsonPointer[] = [];

    if (typeof pred === 'function') {
      JsonPointer.walkObject(obj, (v, p) => (pred(v) && result.push(p), false));
    } else {
      JsonPointer.walkObject(obj, (_, p) => (result.push(p), false));
    }

    return result;
  }

  /**
   * walk obj and pass all values and their paths to the walker function
   * 
   * stops decending into sub-objects if the walker returns true
   */
  public static walkObject(obj: any, walker: (val:any, p:JsonPointer) => boolean) {
    var queue: {val:any; path:JsonPointer;}[] = [];

    queue.push({ val: obj, path: new JsonPointer('')});

    while (0 != queue.length) {
      let { val, path } = queue.shift();
      let keys = Object.keys(val);
      for (let k of keys) {
        let thisVal = val[k];
        let thisPath = path.add(k);
        let more = !walker(thisVal, thisPath);

        let thisType = typeof(thisVal);
        if ((thisType === 'object') && more && !isSimpleObj(thisVal)) {
          queue.push({ val: thisVal, path: thisPath });
        }
      }
    }
  }

  static deref(p:string, obj:any):any {
    return new JsonPointer(p).getValue(obj);
  }

  constructor(ref:string|string[]|JsonPointer, extraUnquoted?:string) {
    if (typeof ref === 'string') {
      this._keypath = (ref || "").split('/').slice(1).map(JsonPointer.unquote);
    } else if (Array.isArray(ref)) {
      this._keypath = ref.slice();
    } else {
      this._keypath = ref._keypath.slice();
    }
    if (null != extraUnquoted) {
      this._keypath.push(extraUnquoted);
    }
  }

  add(extraUnquoted:string):JsonPointer {
    return new JsonPointer(this, extraUnquoted);
  }

  get parent():JsonPointer {
    let kp = this._keypath;
    let len = kp.length;
    return new JsonPointer(kp.slice(0, len-1));
  }

  get(segment:number): string {
    let keypath = this._keypath;
    return keypath[segment + (segment < 0 ? keypath.length : 0)];
  }

  public static unquote(s:string) {
    var result = s.replace(/~1/g, '/');
    result = result.replace(/~0/g, '~');
    return result;
  }

  public static quote(s:string) {
    var result = s.replace(/~/g, '~0');
    result = result.replace(/\//g, '~1');
    return result;
  }

  public static _deref(o:any, k:string) {
    let isDash = k == '-';
    if (isDash) {
      let isArray = Array.isArray(o);
      if (isArray) {
        return o[o.length];
      }
    }
    return o && o[k];
  }

  public static _set(o:any, k:string, v: any) {
    let i: string|number = k;
    if ((k === '-') && Array.isArray(o)) {
      i = o.length;
    }
    o[i] = v;
  }

  getValue(obj:any):any {
    return this._keypath.reduce(JsonPointer._deref, obj);
  }

  setValue(obj:any, val:any, createPath: boolean = false): any {
    let keys = this._keypath;

    if (keys.length == 0) {
      return val;
    }

    let start = obj || (maybeArrayIndex(keys[0]) ? [] : {});
    let tmp = start;
    let i = 0;
    for (let n = keys.length-1; i < n; ++i) {
      let k = keys[i];
      let ntmp = JsonPointer._deref(tmp, k);
      if (null == ntmp) {
        if (createPath || null == obj) {
          ntmp = maybeArrayIndex(keys[i+1]) ? [] : {}
          JsonPointer._set(tmp, k, ntmp);
        } else {
          tmp = null;
          break;
        }
      }
      tmp = ntmp;
    }
    if (null != tmp) {
      JsonPointer._set(tmp, keys[i], val);
    }
    return start;
  }

  deleteValue(obj:any) {
    let last = this.get(-1);
    let parent = this.parent.getValue(obj);
    if (null != parent) {
      delete parent[last];
    }
  }

  asString():string {
    return [''].concat(this._keypath.map(JsonPointer.quote)).join('/');
  }

  toString():string {
    return this.asString();
  }

  get keys():string[] {
    return this._keypath;
  }

  private _keypath:string[];
}

