
/* /// <reference path="../typings/index.d.ts" /> */

export class JsonPointer {
  constructor(ref:string) {
    this._keypath = (ref || "").split('/').slice(1).map(JsonPointer.unquote);
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
    if (Array.isArray(o) && k == '-') {
      return o[o.length];
    }
    return o && o[k];
  }

  getValue(obj:any):any {
    return this._keypath.reduce(JsonPointer.deref, obj);
  }

  asString():string {
    return '/'+(this._keypath.map(JsonPointer.quote).join('/'));
  }

  toString():string {
    return this.asString();
  }

  get keys():string[] {
    return this._keypath;
  }

  private _keypath:string[];
}

