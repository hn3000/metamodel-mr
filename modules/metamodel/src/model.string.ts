import {
  IModelType,
  IModelTypeItem,
  IModelParseContext,
  IModelTypeConstraint
} from "./model.api"

import {
  ModelParseContext
} from "./model.infra"

import {
  ModelConstraints,
  ModelTypeConstraintOptional,
  ModelTypeItem
} from "./model.base"

export class ModelTypeString extends ModelTypeItem<string> {

  constructor(name:string = 'string', c?:ModelConstraints<string>) {
    super(name, c);
  }

  lowerBound(): IModelTypeConstraint<string> { return null; };
  upperBound(): IModelTypeConstraint<string> { return null; };

  parse(ctx:IModelParseContext):string {
    let value = ctx.currentValue();
    let result:string = null;
    if (typeof value === 'string') {
      result = value;
    } else if (ctx.allowConversion && null != value) {
      result = value.toString();
    }
    if (
      null == result && (ctx.currentRequired() || (null != value && !ctx.allowConversion))
    ) {
      if (value == null) {
        ctx.addErrorEx('required value is missing', 'required-empty', { value });
      } else {
        ctx.addErrorEx('value is wrong type', 'value-type', { value });
      }
    } else {
      result = this._checkAndAdjustValue(result, ctx);
    }
    return result;
  }
  validate(ctx:IModelParseContext):void {
    this.parse(ctx);
  }
  unparse(value:string):any {
    return value;
  }

  asString(val:string):string { return val; }
  fromString(val:string):string { return val; }
  create():string { return ""; }

  protected _kind() { return 'string'; }

}

export class ModelTypeConstraintLength extends ModelTypeConstraintOptional<string> {
  constructor(minLen: number|undefined, maxLen: number|undefined, message?: string) {
    super();
    this._minLength = minLen;
    this._maxLength = maxLen;

    if (null != message) {
      this._message = message;
    } else {
      var msg:string;
      if (minLen == undefined || minLen == 0) {
        msg = `length must be at most ${maxLen}:`;
      } else if (maxLen == null) {
        msg = `length must be at least ${minLen||0}:`;
      } else {
        msg = `length must be between ${minLen||0} and ${maxLen}:`;
      }
      this._message = msg;
    }
  }


  protected _id():string {
    let from = this._minLength != null ? `${this._minLength} <= `:'';
    let to   = this._maxLength != null ? `<= ${this._maxLength}`:'';
    return `${from}length${to}`;
  }

  checkAndAdjustValue(value:string, ctx:IModelParseContext):string {
    var result = value;

    if (!ctx.currentRequired() && (null == value || '' == value)) {
      return value;
    }
    if (null != value) {
      let length = value.length;
      let minLength = this._minLength;
      let maxLength = this._maxLength;


      if (null != minLength && length < minLength) {
        ctx.addMessageEx(!this.isWarningOnly, this._message, 'value-short', {value, minLength, maxLength});
        if (!this.isWarningOnly && ctx.allowConversion) {
          result = null;
        }
      }
      if (null != this._maxLength && length > this._maxLength) {
        ctx.addMessageEx(!this.isWarningOnly, this._message, 'value-long', {value, minLength, maxLength});
        if (!this.isWarningOnly && ctx.allowConversion) {
          result = null;
        }
      }
    }
    return result;
  }

  get minLength():number {
    return this._minLength || 0;
  }

  get maxLength():number {
    return this._maxLength;
  }

  private _minLength:number;
  private _maxLength:number;
  private _message:string;
}


export class ModelTypeConstraintRegex extends ModelTypeConstraintOptional<string> {
  constructor(pattern:string|RegExp, flags?:string, message?:string) {
    super();

    var patternSource = (<RegExp>pattern).source || pattern.toString();
    this._pattern = new RegExp(patternSource, flags||'');
    if (null != message) {
      this._message = message;
    } else {
      this._message = `value does not match ${this._pattern.toString()}:`;
    }
  }

  protected _id():string { return `pattern[${this._pattern}]`; }

  checkAndAdjustValue(value:string, ctx:IModelParseContext):string {
    var result = value;

    if (!ctx.currentRequired() && (null == value || '' == value)) {
      return value;
    }
    let pattern = this._pattern;
    if (! pattern.exec(value)) {
      if (this.isWarningOnly) {
        ctx.addWarningEx(this._message, 'value-warning', { value, pattern } );
        result = value;
      } else {
        ctx.addErrorEx(this._message, 'value-invalid', { value, pattern });
        result = null;
      }
    }
    return result;
  }

  private _pattern:RegExp;
  private _message:string;
}

export class ModelTypeConstraintInvalidRegex extends ModelTypeConstraintOptional<string> {
  constructor(pattern:string|RegExp, flags?:string, message?:string) {
    super();

    var patternSource = (<RegExp>pattern).source || pattern.toString();
    this._pattern = new RegExp(patternSource, flags||'g');
    if (null != message) {
      this._message = message;
    } else {
      this._message = `value should not match ${this._pattern.toString()}:`;
    }
  }

  protected _id():string { return `pattern[${this._pattern}]`; }

  checkAndAdjustValue(value:string, ctx:IModelParseContext):string {
    var result = value;

    if (null == value || '' == value) {
      return value;
    }
    let pattern = this._pattern;
    let matches:string[] = [];
    let match:RegExpExecArray = null;
    do {
      match = pattern.exec(value);
      if (match) {
        let matchVal = match[1] || match[0];
        if (-1 == matches.indexOf(matchVal)) {
          matches.push(matchVal);
        }
      }
    } while (match && this._pattern.global);

    if (matches.length > 0) {
      let invalidRaw = matches.join('');
      matches.sort();
      let invalid = matches.join('');

      if (this.isWarningOnly) {
        ctx.addWarningEx(this._message, 'value-warning-text', { value, pattern, invalid, invalidRaw } );
        result = value;
      } else {
        ctx.addErrorEx(this._message, 'value-invalid-text', { value, pattern, invalid, invalidRaw });
        result = null;
      }
    }
    return result;
  }

  private _pattern:RegExp;
  private _message:string;
}
