
export {
  ILoaderMetadata,
  ILocateContext,
  IFetchContext,
  ITranslateContext,
  IInstantiateContext,
  ICustomLoader
} from "./loader.plugin.api";


import {
  ILoaderMetadata,
  ILocateContext,
  IFetchContext,
  ITranslateContext,
  IInstantiateContext,
  ICustomLoader
} from './loader.plugin.api';

import jsonSchemaLoader from './jsonschema.loader';

export default jsonSchemaLoader;

module.exports = jsonSchemaLoader;

