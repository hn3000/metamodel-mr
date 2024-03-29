import {
  IModelParseContext,
  IModelTypeConstraint,
  IModelTypeConstrainable,
  Predicate,
  IModelTypeItem,
  IClientProps,
  IModelTypeComposite
} from "./model.api"


export class ClientProps implements IClientProps {

  constructor(initProps?: IClientProps|any) {
    if (null != initProps) {
      this.propsCopyFrom(initProps);
    }
  }
  propExists(key:string):boolean {
    return this._data.hasOwnProperty(key);
  }
  propGet(key:string):any {
    return this._data[key];
  }
  propSet(key:string, val:any):void {
    this._data[key] = val;
  }
  propKeys():string[] {
    return Object.keys(this._data);
  }

  propsCopyFrom(that: IClientProps|any) {
    if (that.propKeys && that.propGet) {
      const keys = that.propKeys();
      for (let k of keys) {
        this.propSet(k, that.propGet(k));
      }
    } else {
      const keys = Object.keys(that);
      for (let k of keys) {
        this.propSet(k, that[k]);
      }
    }
  }

  private _data:any = {};
}


export class ModelConstraints<T> implements IModelTypeConstraint<T> {
  constructor(constraints:ModelConstraints<T>|IModelTypeConstraint<T>[]) {
    if (Array.isArray(constraints)) {
      this._constraints = constraints.slice();
    }
  }
  get id():string {
    return this._constraints.map((x)=>x.id).join('+');
  }
  checkAndAdjustValue(val:T, ctx:IModelParseContext):T {
    let result = val;
    for (let c of this._constraints) {
      result = c.checkAndAdjustValue(result, ctx);
    }
    return result;
  }
  add(...c:IModelTypeConstraint<T>[]) {
    return new ModelConstraints<T>([...this._constraints, ...c]);
  }

  filter(p:Predicate<IModelTypeConstraint<T>>):IModelTypeConstraint<T>[] {
    return this._constraints.filter(p);
  }

  slice(names:string[]|number[]): ModelConstraints<T> {
    let nn = names as string[];
    let innames = (n:string) => -1 != nn.indexOf(n);

    let slicer = (x:IModelTypeConstraint<T>) => {
      return (x && ('slice' in x)) ? x.slice(names) : x;
    }
    let predicate = (x:IModelTypeConstraint<T>) => {
      return x && (!x.usedItems || !x.usedItems() || x.usedItems().every(innames));
    }

    let sliced = this._constraints.map(slicer);
    sliced = sliced.filter(predicate);

    return new ModelConstraints<T>(sliced);
  }

  toString() {
      return this._constraints.map(x=>x.id).join(",");
  }

  private _constraints: IModelTypeConstraint<T>[];
}

export abstract class ModelTypeConstrainable<T>
  extends ClientProps
  implements IModelTypeConstrainable<T>
{
  constructor(name:string, constraints:ModelConstraints<T> = null) {
    super();
    this._name = name;
    this._constraints = constraints || new ModelConstraints<T>([]);
    let cid = this._constraints.id;
    this._qualifiers = [
      `type-${this._name}`,
      //`kind-${this.kind}`,
      `constraints-${cid}`
    ];
  }

  propSet(key:string, value:any) {
    super.propSet(key, value);
    if (key === 'schema') {
      this._setQualifier('format', value && value.format);
      this._setQualifier('schemaid', value && value.id);
    }
  }

  get name():string { return this._name; }
  get qualifiers():string[] { return this._qualifiers; }
  get kind():string { return this._kind(); }

  asItemType() : IModelTypeItem<T> | undefined { return undefined; }
  asCompositeType() : IModelTypeComposite<T> | undefined { return undefined; }

  withConstraints(...c:IModelTypeConstraint<T>[]):this {
    return this.withNameAndConstraints(undefined, ...c);
  }
  withNameAndConstraints(name: string, ...c:IModelTypeConstraint<T>[]):this {
    let result = this._clone(this._constraints.add(...c));
    if (name !== undefined) {
      result._setName(name);
    } else if (this.kind != 'object') {
      result._setName(this.name + '/' + result._constraints.id);
    }
    return result;
  }
  findConstraints(p:(x:IModelTypeConstraint<T>)=>boolean):IModelTypeConstraint<T>[] {
    var result = this._constraints.filter(p);
    return result;
  }

  protected _addConstraint(c:IModelTypeConstraint<T>): void {
    this._constraints = this._constraints.add(c);
  }

  abstract parse(ctx:IModelParseContext):T;
  abstract validate(ctx:IModelParseContext):void;
  abstract unparse(val:T):any;
  abstract create():T;
  createEmpty():T {
    return null;
  }

  protected abstract _kind():string;

  protected _setName(name:string) {
    this._name = name;
  }
  protected _setQualifier(scope:string, value: string) {
    let prefix = scope + '-';
    this._qualifiers.filter((x) => -1 === x.indexOf(prefix));
    if (null != value) {
      this._qualifiers.push(`${scope}-${value}`);
    }
  }
  protected _clone(constraints:ModelConstraints<T>):this {
      return new (<any>this.constructor)(null, constraints);
  }
  protected _checkAndAdjustValue(val:T, ctx:IModelParseContext):T {
    return this._constraints.checkAndAdjustValue(val, ctx);
  }
  protected _getConstraints(): ModelConstraints<T> {
    return this._constraints;
  }


  private _name:string;
  private _qualifiers:string[];
  private _constraints:ModelConstraints<T>;
}

export abstract class ModelTypeItem<T>
    extends ModelTypeConstrainable<T>
    implements IModelTypeItem<T>
{
  asItemType() : IModelTypeItem<T> {
      return this;
  }

  asCompositeType(): undefined {
    return undefined;
  }

  abstract lowerBound(): IModelTypeConstraint<T>;
  abstract upperBound(): IModelTypeConstraint<T>;
  possibleValues(): T[] {
    let candidates = this.findConstraints((x:any)=> (x instanceof ModelTypeConstraintPossibleValues) && (null != x["allowedValues"]));
    let values = candidates.reduce((pv:T[],c:IModelTypeConstraint<T>) => {
      var cc = c as ModelTypeConstraintPossibleValues<T>;
      return intersectArrays(pv, cc.allowedValues);
    }, null);

    return values;
  }

  abstract parse(ctx:IModelParseContext):T;
  abstract validate(ctx:IModelParseContext):void;
  abstract unparse(val:T):any;

  abstract fromString(val:string):T;
  abstract asString(val:T):string;

}

export function intersectArrays<T>(a:T[], b:T[]) {
  if (null == a) return b;
  if (null == b) return a;
  let result:T[] = [];
  for (let t of a) {
    if (-1 != b.indexOf(t)) {
      result.push(t);
    }
  }
  return result;
}

export abstract class ModelTypeConstraintOptional<T> implements IModelTypeConstraint<T> {
  constructor() {
    this._onlyWarn = false;
  }
  warnOnly():this {
      var result = new (<any>this.constructor)(this);
      result._onlyWarn = true;
      return result;
  }
  abstract checkAndAdjustValue(v:T, c:IModelParseContext):T;

  get isWarningOnly() { return this._onlyWarn; }
  get id():string {
    var result:string;
    if (this._onlyWarn) {
      result = `(${this._id()})`;
    } else {
      result = `${this._id()}`;
    }
    return result;
  }

  protected abstract _id():string;

  private _onlyWarn: boolean;
}

export class ModelTypeConstraintPossibleValues<T> extends ModelTypeConstraintOptional<T> {
  constructor(values:T[]) {
    super();
    this._allowedValues = values || [];
  }

  public get allowedValues():T[] {
    return this._allowedValues.slice(); // might wanna return a copy
  }

  protected _id():string { return `oneof[${this._allowedValues.join(',')}]`; }

  checkAndAdjustValue(value:T, ctx:IModelParseContext):T {
    var result = value;
    let allowed = this._allowedValues;

    if (null != value) {
      if (-1 === allowed.indexOf(value)) {
        if (this.isWarningOnly) {
          ctx.addWarningEx('not a recommended value', 'value-warning', { value, allowed });
          result = value;
        } else {
          ctx.addErrorEx('not a valid value', 'value-invalid', { value, allowed });
          result = null;
        }
      }
    }

    return result;
  }


  private _allowedValues:T[];
}

