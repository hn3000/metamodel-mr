
import { IModelType, IModelTypeComposite, ModelTypeArray } from '@hn3000/metamodel';

export type MetamodelMatchFun =
  (
    type: IModelType<any>, 
    fieldName:string, 
    flavor:string, 
    container?: IModelTypeComposite<any>
  ) => number;


/**
 * Type for a function that determines match quality of a control
 * for dealing with a given field of the specified type.
 * 
 * Used by the IFormConfig to find a component for rendering an
 * input in a form. If several components match equally well,
 * the form config returns the component that was added last.
 * 
 * see IFormConfig.findBestMatch
 *  
 */

export class MatchQ {
  /** 
   * Matches by fieldName, match quality is 100 times that of other criteria by default.
   * The quality argument can be used to change the strength of the match. 
   */
  static fieldName(name:string, quality: number = 100):MetamodelMatchFun {
    return (type:IModelType<any>, fieldName: string) => (fieldName === name ? quality:0)
  }
  /** 
   * Matches fieldName with a regular expression, match quality is 90 times that of other 
   * criteria by default (which is less than a fieldName match).
   * The quality argument can be used to change the strength of the match. 
   */
  static fieldNameLike(pattern:RegExp|string, quality: number = 90):MetamodelMatchFun {
    let re = ('string' === typeof pattern) ? new RegExp(pattern) : pattern; 
    return (type:IModelType<any>, fieldName: string) => (re.test(fieldName) ? quality:0)
  }
  /** 
   * Matches by a type's name.
   * The quality argument can be used to change the strength of the match. 
   */
  static typeName(name:string, quality: number = 1):MetamodelMatchFun {
    return (type:IModelType<any>, fieldName: string) => (type.name === name ? quality:0)
  }
  /** 
   * Matches typeName with a regular expression, match quality is that of other 
   * criteria by default.
   * The quality argument can be used to change the strength of the match. 
   */
  static typeNameLike(pattern:RegExp|string, quality: number = 1):MetamodelMatchFun {
    let re = ('string' === typeof pattern) ? new RegExp(pattern) : pattern; 
    return (type:IModelType<any>, fieldName: string) => (re.test(type.name) ? quality:0)
  }
  /** 
   * Matches by similarity of the fieldType to the given object literal, all props must match. 
   * Every matching item (i.e. key in the template) counts as 1 by default, the
   * quality argument changes the quality per match. 
   */
  static likeObject(template:any, quality: number = 1): MetamodelMatchFun { //</any>
    var keys = Object.keys(template);
    var n = keys.length;

    return ((field:IModelType<any>, fieldName, flavor, container?: IModelTypeComposite /*</any>*/) => {
      var result = 0;
      var fieldObj = field as any;
      let schema = (fieldObj && fieldObj.propGet && fieldObj.propGet('schema')) || {};
      let item = (container && container.findItem(fieldName)) || {} as any;
      for (var i = 0; i < n; i++) {
        let k = keys[i];
        let t = template[k];
        if (t == fieldObj[k] || t == item[k] || t == schema[k]) {
          result += quality;
        } else {
          return 0;
        }
      }
      return result;
    });
  }
  /**
   *  Matches by similarity of the container type to the given object literal, all props must match. 
   * Every matching item (i.e. key in the template) counts as 1 by default, the
   * quality argument changes the quality per match. 
   */
  static containerLikeObject(template:any, quality: number = 1): MetamodelMatchFun { //</any>
    return MatchQ.container(MatchQ.likeObject(template, quality));
  }
  /** 
   * Matches by IModelType.kind, the match counts as 1 point by default. 
   * The quality argument can be used to change the strength of the match. 
   */
  static kind(kind:string, quality: number = 1):MetamodelMatchFun {
    const kk = kind === 'boolean' ? 'bool' : kind;
    return (field:IModelType<any>) => (field.kind === kk ? quality : 0)
  }
  /**
   * Matches by flavor. Flavor can be given as a prop on the MetaInput or in the schema 
   * (where brit. spelling flavour and x- prefix are also accepted).
   * By default, a match is worth one point, the quality argument can be used to
   * change the value of a match. 
   */
  static flavor(flavor:string, quality: number = 1):MetamodelMatchFun {
    let flv = flavor;
    return (type: IModelType<any>, _fieldName:string, flavor:string) => {
      if (
        (flavor === flv)
        || ((x) => x && ((x.flavor === flv) || (x.flavour === flv)))(type.propGet('schema'))
      ) {
        return quality;
      }
      return 0;
    };
  }
  /**
   * Matches by flavour. Flavour can be given as a prop on the MetaInput or in the schema 
   * (where amer. spelling flavor and x- prefix are also accepted).
   * By default, a match is worth one point, the quality argument can be used to
   * change the value of a match. 
   */
  static flavour(flavour:string, quality: number = 1):MetamodelMatchFun {
    return MatchQ.flavor(flavour, quality);
  }
    /** 
   * Matches by format, shorthand for .likeObject({format:'<format>'}).
   * By default, flavor matches are worth one point; the quality argument
   * can be used to change this. 
   */
  static format(format:string, quality: number = 1):MetamodelMatchFun {
    return (type: IModelType<any>, fieldName:string, flavor:string, ...matchArgs: any[]) => {
      if (
        ((x) => x && (x.format === format))(type.propGet('schema'))
      ) {
        return quality;
      }
      return 0;
    };
  }  
  /** 
   * Matches an array type that has elements matching the given matcher.
   * By default, a match is worth 2 times that of the base matcher (to
   * reflect the fact it's an array), the quality argument can be used to 
   * change the factor.
   */
  static element(matcher: MetamodelMatchFun, quality: number = 2):MetamodelMatchFun {
    return (type: IModelType<any>, fieldName:string, flavor:string, _container?: IModelTypeComposite) => {
      let arrayType = type as ModelTypeArray<any>;
      if (arrayType.itemType && arrayType.itemType()) {
        return matcher(arrayType.itemType(), fieldName, flavor, arrayType) * quality;
      }
      return 0;
    };
  }
  /** 
   * Matches if the number of possible values for the element is between from (inclusive)
   * and to (exclusive). Only matches for types that actually have an enumerated list
   * of possible values, so will not match unconstrained numbers or strings. If no upper
   * limit (`to`) is given or it is specified as 0, only the minimum is checked.
   * 
   * By default, a match is worth one point, the quality argument can be used to
   * change the value of a match. 
   */
  static possibleValueCountRange(from:number, to?:number, quality: number = 1) {
    return (field:IModelType<any>) => {
      let possibleValues = field?.asItemType()?.possibleValues();
      let pvc = possibleValues ? possibleValues.length : 0;
      if ((pvc >= from) && (!to || pvc < to)) {
        return quality;
      }
      return 0;
    }
  }
  /** 
   * Matches if all given matchers match by adding the returned quality values. 
   * Quality is zero if any of the matchers returns zero, the sum of all quality
   * values if none of the matchers returned zero. 
   */
  static and(...matcher:MetamodelMatchFun[]):MetamodelMatchFun {
    return (type: IModelType<any>, fieldName:string, flavor:string, container?: IModelTypeComposite) => {
      const t = matcher.reduce(([sum,fact], m: MetamodelMatchFun) => {
        let qq: number = m(type, fieldName, flavor, container);
        return qq > 0 ? [sum + qq, fact*1] : [0, 0];
      }, [0,1]);
      return t[0] * t[1];
    }
  }
  /** 
   * Matches if any of the given matchers match by adding the returned quality values. 
   * Quality is the sum of all quality values and can only be zero if all of the matchers
   * returned zero.
   */
  static or(...matcher:MetamodelMatchFun[]):MetamodelMatchFun {
    return (type: IModelType<any>, fieldName:string, flavor:string, container?: IModelTypeComposite) =>
      matcher.reduce((q, m) => {
        let qq = m(type, fieldName, flavor, container);
        return q + ((null != qq) ? qq : 0);
      }, 0);
  }
  /**
   * Multiply quality of a matcher by a factor. Can be used to manipulate priority of matchers 
   * in case the default qualities don't work well.
   * 
   * @param matcher the base matcher
   * @param factor that a match is multiplied by
   */
  static prioritize(factor: number, matcher: MetamodelMatchFun):MetamodelMatchFun {
    return (type: IModelType<any>, fieldName: string, flavor: string, container?: IModelTypeComposite) => {
      return matcher(type, fieldName, flavor, container) * factor;
    }
  }

  /**
   * Change match to use the containerType. 
   */
  static container(matcher: MetamodelMatchFun, qualityFactor: number = 1): MetamodelMatchFun {
    return (
      _type: IModelType<any>, 
      fieldName: string, 
      flavor: string, 
      container?: IModelTypeComposite<any>
    ) => {
      if (!container) return 0;
      return matcher(container, fieldName, flavor, container) * qualityFactor;
    }; 
  }
}

export interface IMetamodelMatchMaker<T> {
  findBest(
    type: IModelType<any>, 
    fieldName:string, 
    flavor:string, 
    container?: IModelTypeComposite<any>
  ) : [ T, MetamodelMatchFun ];
  findTopN(
    n: number,
    type: IModelType<any>, 
    fieldName:string, 
    flavor:string, 
    container?: IModelTypeComposite<any>
  ) : [ T, number, MetamodelMatchFun ][];

  getAll(): [T, MetamodelMatchFun][];
}

export interface IMetamodelMatchMakerBuilder<T> {
  add(t: T, fun: MetamodelMatchFun): this;
  addAll(matchPairs: [T, MetamodelMatchFun][]): void;
  addFrom(matchMaker: IMetamodelMatchMaker<T>): void;

  freeze(): IMetamodelMatchMaker<T>;
}

export function matchMakerBuilder<T>(matchPairs?: [T, MetamodelMatchFun][]): IMetamodelMatchMakerBuilder<T> {
  const result = new MetamodelMatchMakerBuilder<T>();
  if (undefined !== matchPairs) {
    result.addAll(matchPairs);
  }
  return result;
}


class MetamodelMatchMakerBuilder<T> implements IMetamodelMatchMakerBuilder<T> {
  add(t: T, fun: MetamodelMatchFun) {
    this.addAll([[t, fun]]);
    return this;
  }
  addAll(pairs: [T, MetamodelMatchFun][]) {
    this._pairs = this._pairs.concat(pairs);
  }

  addFrom(that: IMetamodelMatchMaker<T>) {
    this.addAll(that.getAll());
  }

  freeze(): IMetamodelMatchMaker<T> {
    return new MetamodelMatchMaker(this._pairs.slice());
  }

  private _pairs = [] as [T, MetamodelMatchFun][];
}

class MetamodelMatchMaker<T> implements IMetamodelMatchMaker<T> {
  constructor(pairs: [T, MetamodelMatchFun][]) {
    this._pairs = pairs;
  }
  findBest(
    type: IModelType<any>, 
    fieldName: string, 
    flavor: string, 
    container?: IModelTypeComposite<any>
  ): [ T, MetamodelMatchFun ] {
    const top = this.findTopN(1, type, fieldName, flavor, container);
    return [ top[0]?.[0], top[0]?.[2]];
  }
  findTopN(
    n: number,
    type: IModelType<any>, 
    fieldName: string, 
    flavor: string, 
    container?: IModelTypeComposite<any>
  ): [ T, number, MetamodelMatchFun ][] {
    const result = [] as [T, number, MetamodelMatchFun][];

    this._pairs.forEach(x => {
      
      const thisOne = x[1](type, fieldName, flavor, container);
      if (thisOne > 0) {
        insertSorted(result, [x[0], thisOne, x[1]], n);
      }
    });

    return result;
  }

  getAll() {
    return this._pairs;
  }
  private _pairs: [ T, MetamodelMatchFun ][];
}

function insertSorted<T,F>(all: [T, number, F][], one: [T, number, F], maxLength: number) {
  let insertPos = all.findIndex(x => one[1] > x[1]);
  if (insertPos < 0) {
    insertPos = all.length;
  }
  if (insertPos > maxLength) {
    return;
  }
  all.splice(insertPos, 0, one);
  if (all.length > maxLength) {
    all.splice(maxLength, all.length-maxLength);
  }
  console.log('insertSorted', all, one);
}
