
/* /// <reference path="../typings/index.d.ts" /> */

export class JsonPointer {
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

  get segments():string[] {
    return this._keypath.slice();
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

  public static deref(o:any, k:string) {
    let isDash = k == '-';
    if (isDash) {
      let isArray = Array.isArray(o);
      if (isArray) {
        return o[o.length];
      }
    }
    return o && o[k];
  }

  getValue(obj:any):any {
    return this._keypath.reduce(JsonPointer.deref, obj);
  }

  setValue(obj:any, val:any, createPath: boolean = false): any {
    let keys = this._keypath.slice();
    let last = keys.pop();
    let start = obj || {};
    let tmp = start;
    for (let k of keys) {
      if (null == tmp[k]) {
        if (createPath || null == obj) {
          tmp[k] = { }; // we don't know if it should be an array
        } else {
          tmp = null;
          break;
        }
      }
      tmp = tmp[k];
    }
    if (null != tmp) {
      tmp[last] = val;
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

