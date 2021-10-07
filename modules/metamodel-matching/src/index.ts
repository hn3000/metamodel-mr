
import { IModelType } from '@hn3000/metamodel';

export interface IMetamodelMatcher {
  (type: IModelType): number;
}