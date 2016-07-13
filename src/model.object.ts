import {
  IModelType,
  IModelTypeItem,
  IModelTypeCompositeBuilder,
  IModelTypeEntry,
  IModelTypeComposite,
  IModelParseContext,
  IModelTypeConstraint
} from "./model.api"

import {
  ModelTypeConstrainable,
  ModelConstraints,
  ModelTypeConstraintOptional
} from "./model.base"

function constructionNotAllowed<T>():T {
  throw new Error('can not use subtype for construction');
}

export class ModelTypeObject<T> 
  extends ModelTypeConstrainable<T>
  implements IModelTypeCompositeBuilder<T>
{
  private _constructFun: ()=>T;
  private _entries: IModelTypeEntry[];
  private _entriesByName: { [key:string]:IModelTypeEntry };

  constructor(name:string, construct?:()=>T, constraints?:ModelConstraints<T>) {
    super(name, constraints);
    this._constructFun = construct || (()=>(<T>{}));
    this._entries = [];
    this._entriesByName = { };
  }

  protected _clone(constraints:ModelConstraints<T>):this {
    let result = new (<any>this.constructor)(this.name, this._constructFun, constraints);
    for (var e of this._entries) {
      result.addItem(e.key, e.type, e.required);
    }
    return result;
  }

  asItemType():IModelTypeItem<T> {
    return null;
  }

  addItem(key:string, type:IModelType<any>, required?:boolean):IModelTypeCompositeBuilder<T> {
    if (null == key) {
      throw new Error(`addItem requires valid key, got ${key} and type ${type}`);
    }
    if (null == type) {
      throw new Error(`addItem requires valid type, got ${type} for key ${key}`);
    }

    if (null == this._entriesByName[key]) {
      let entry = {
        key, type, required
      };
      this._entries.push(entry);
      this._entriesByName[key] = entry;
    }
    return this;
  }

  subModel(name:string|number) {
    if (typeof name === 'string' || typeof name === 'number') {
      let entry = this._entriesByName[name]; 
      return entry && entry.type;
    }

    return null;
  }

  slice(names:string[]|number[]):IModelTypeComposite<T> {
    if (Array.isArray(names)) {
      let filteredConstraints = this._getConstraints().slice(names);

      var result = new ModelTypeObject<any>(`${this.name}[${names.join(',')}]`, this._constructFun, filteredConstraints); // constructionNotAllowed ?
      for (var name of names) {
        let entry = this._entriesByName[name];
        if (entry) {
          result.addItem(''+name, entry.type, entry.required);
        }
      }
      return result;
    }
    return null;
  }

  extend<X>(type:IModelTypeComposite<X>):IModelTypeCompositeBuilder<T> {
    let constraints:IModelTypeConstraint<any>[] = type.findConstraints(()=>true);
    let result = this.withConstraints(...constraints);
    for (var item of type.items) {
      let { key, type, required } = item;
      result.addItem(key, type, required)
    }
    return result;
  }

  get items():IModelTypeEntry[] {
    return this._entries;
  }

  parse(ctx:IModelParseContext):T {
    let result = this.create();
    for (let e of this._entries) {
      ctx.pushItem(e.key, e.required);
      (<any>result)[e.key] = e.type.parse(ctx);
      ctx.popItem();
    }
    return result;
  }
  validate(ctx:IModelParseContext):void {
    for (let e of this._entries) {
      ctx.pushItem(e.key, e.required);
      e.type.validate(ctx);
      ctx.popItem();
    }

    this._checkAndAdjustValue(ctx.currentValue(), ctx);
  }
  unparse(value:T):any {
    let result:any = {};
    let val:any = value;
    for (let e of this._entries) {
      let item = val[e.key];
      if (undefined !== item) {
        result[e.key] = e.type.unparse(item);
      }
    }
    return result;
  }
  create():T {
    return this._constructFun ? this._constructFun() : <T><any>{};
  }

  protected _kind() { return 'object'; }

}

function safeArray<T>(val:T|T[]):T[] {
  return  Array.isArray(val) ? val.slice() : null != val ? [ val ] : null;
}

export interface IEqualPropertiesConstraintOptions {
  properties: string|string[];
}


export class ModelTypeConstraintEqualProperties extends ModelTypeConstraintOptional<any> {
  constructor(fieldsOrSelf:string[]|IEqualPropertiesConstraintOptions|ModelTypeConstraintEqualProperties) {
    super();
    if (Array.isArray(fieldsOrSelf)) {
      this._fields = fieldsOrSelf.slice();
    } else if (fieldsOrSelf && (fieldsOrSelf as IEqualPropertiesConstraintOptions).properties) {
      this._fields = safeArray((fieldsOrSelf as IEqualPropertiesConstraintOptions).properties);
    } else {
      this._fields = (<ModelTypeConstraintEqualProperties>fieldsOrSelf)._fields.slice();
    }
  }
  private _isConstraintEqualFields() {} // marker property

  protected _id():string {
    return `equalFields(${this._fields.join(',')})`;
  }

  checkAndAdjustValue(val:any, ctx:IModelParseContext):Date {
    let fields = this._fields;
    var check = true;
    fields.reduce((a,b) => { check = check && val[a] == val[b]; return b; });
    let result = val;
    if (!check) {
      for (var f of fields) {
        ctx.pushItem(f, !this.warnOnly());
        ctx.addError(`expected fields to be equal: ${fields.join(',')}.`);
        ctx.popItem();
      }
    }
    return result;
  }

  usedItems():string[] { return this._fields; }

  private _fields:string[];
}

export interface IConditionOptions {
  property: string;
  value: string|string[]|number|number[];
  op?: "=";
  invert: boolean;
}

function createPredicate(condition: IConditionOptions) {
  let { property, value, op, invert } = condition;

  if (Array.isArray(value)) {
    let valueArray = value.slice() as any[];

    return (x:any) => {
      let p = x[property];
      return (-1 != valueArray.indexOf(p)) == !invert;
    }
  }
  return function(x:any): boolean {
    return (value === x[property]) == !invert;
  }
}

function createValuePredicate(possibleValues:string[]|number[]): (x:string|number) => boolean {
  if (null == possibleValues || 0 === possibleValues.length) {
    return (x:string|number) => x != null;
  } else if (possibleValues.length == 1) {
    let val = possibleValues[0];
    return (x:string|number) => x == val;
  } else {
    let valArray = possibleValues as any[];
    return (x:string|number) => -1 != valArray.indexOf(x as any);
  }
}

export interface IConditionalValueConstraintOptions {
  condition: IConditionOptions;

  // properties to require (may be just single item)  
  properties: string|string[];
  // if required is a single string, this is allowed:
  possibleValue?: string|number|string[]|number[];
}

export interface IConditionalValueConstraintSettings {
  id:string;
  predicate: (x:any) => boolean;
  valueCheck: (x:any) => boolean;
  properties: string[];
  possibleValues: any[];

}

export class ModelTypeConstraintConditionalValue extends ModelTypeConstraintOptional<any> {
  constructor(optionsOrSelf:IConditionalValueConstraintOptions|ModelTypeConstraintConditionalValue) {
    super();
    let options = optionsOrSelf as IConditionalValueConstraintOptions;

    if (options.condition && options.properties) {
      let { condition, properties, possibleValue } = options;
      let multiple = Array.isArray(properties) && properties.length > 1; 
      if (multiple && null != possibleValue && !Array.isArray(possibleValue)) {
        throw new Error("must not combine list of required fields with single possibleValue");
      }

      let props = safeArray(properties);
      let allowed = safeArray<any>(possibleValue);

      let id_p = props.join(',');
      let id_v = allowed ? " == [${allowed.join(',')}]" : ""
      let id = `conditionalValue(${condition.property} == ${condition.value} -> ${id_p}${id_v})`;


      this._settings = {
        predicate: createPredicate(condition),
        valueCheck: createValuePredicate(allowed),
        properties: props,
        possibleValues: allowed,
        id: id
      };

    } else if (this._isConstraintConditionalValue == (<any>optionsOrSelf)["_isConstraintConditionalValue"]) {
      this._settings = (<ModelTypeConstraintConditionalValue>optionsOrSelf)._settings;
    } else {
      console.log("invalid constructor argument", optionsOrSelf);
      throw new Error("invalid constructor argument" + optionsOrSelf);
    }
  }
  private _isConstraintConditionalValue() {} // marker property

  protected _id():string {
    return this._settings.id;
  }

  checkAndAdjustValue(val:any, ctx:IModelParseContext):Date {
    var check = true;
    let s = this._settings;
    if (s.predicate(val)) {
      let isError = !this.isWarningOnly;
      for (var f of s.properties) {
        ctx.pushItem(f, isError);
        let thisValue = ctx.currentValue();
        let valid = s.valueCheck(thisValue);
        if (!valid) {
          if (s.possibleValues) {
            ctx.addMessage(isError, `illegal value.`, ctx.currentValue(), s.possibleValues);
          } else {
            ctx.addMessage(isError, `required field not filled.`);
          }
        }
        ctx.popItem();
      }
    }

    return val;
  }

  usedItems():string[] { return this._settings.properties; }


  private _settings:IConditionalValueConstraintSettings;
}

/**
 * can be used for validation, only, not for value modification
 */
export class ModelTypePropertyConstraint extends ModelTypeConstraintOptional<any> {
  constructor(property:string, constraint: IModelTypeConstraint<any>) {
    super();
    this._property = property;
    this._constraint = constraint;
  }

  _id():string {
    return `${this._constraint.id}@${this._property}`; 
  }

  checkAndAdjustValue(val:any, ctx:IModelParseContext):any {
    ctx.pushItem(this._property);
    try {
      this._constraint.checkAndAdjustValue(ctx.currentValue(), ctx);
    } catch (err) {
      ctx.addMessage(!this.isWarningOnly, "value had unexpected type", err);
    }
    ctx.popItem();
    return val;
  }

  usedItems():string[] { return [ this._property ]; }  

  private _property:string;
  private _constraint:IModelTypeConstraint<any>
}