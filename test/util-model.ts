import {
  ModelTypeArray,
  ModelTypeBool,
  ModelTypeNumber,
  ModelTypeRegistry,
  ModelTypeString
} from '@hn3000/metamodel';
import { Operation, APIModel } from '../src/metaapi';

let modelTypes = new ModelTypeRegistry();

modelTypes.addType(new ModelTypeString('string'));
modelTypes.addType(new ModelTypeNumber('number'));
modelTypes.addType(new ModelTypeBool('boolean'));
modelTypes.addArrayType(modelTypes.itemType('string'));
modelTypes.addObjectType('response'); // empty object type matches any (ignores all contents)

let paramsType = modelTypes.addObjectType('requestParams')
  .addItem('q', modelTypes.type('string'), true)
  .addItem('a', new ModelTypeArray(modelTypes.type('string')), true)
  .addItem('b', new ModelTypeArray(modelTypes.type('string')), false)
  .addItem('corpus',
    modelTypes.addObjectType('bodyParam')
      .addItem('a', modelTypes.type('number'), true)
      .addItem('b', modelTypes.type('number'), true)
    , false)
  .addItem('caput', new ModelTypeArray(modelTypes.type('string')), false)
  .addItem('param', modelTypes.type('string'), true)
  ;
paramsType.itemType('q').propSet('schema', { in: 'query' });
paramsType.itemType('a').propSet('schema', { format: 'multi', in: 'query' });
paramsType.itemType('b').propSet('schema', { format: 'csv', in: 'query' });
paramsType.itemType('corpus').propSet('schema', { in: 'body' });
paramsType.itemType('caput').propSet('schema', { in: 'header' });
paramsType.itemType('param').propSet('schema', { in: 'path' });

let paramsTypeNone = modelTypes.addObjectType('requestParamsNone');

export let opWithParams = new Operation({
  id: 'withParams',
  pathPattern: '/op/{param}',
  responseModel: { 200: modelTypes.type('response') },
  requestModel: {
    format: 'empty',
    paramsType,
    paramsByLocation: {
      query: [ 'q', 'a', 'b' ],
      body: ['corpus'],
      header: ['caput'],
      path: ['param'],
      formData: [],
    },
    locationsByParam: {
      'q': 'query',
      'a': 'query',
      'b': 'query',
      'param': 'path',
      'corpus': 'body',
      'caput': 'header'
    }
  }
});

export let opNoParams = new Operation({
  id: 'noParams',
  pathPattern: '/op-no-params/',
  responseModel: { 200: modelTypes.type('response')},
  requestModel: {
    format: 'empty',
    paramsType: paramsTypeNone,
    locationsByParam: {},
    paramsByLocation: {
      body: [],
      header: [],
      path: [],
      formData: [],
      query: []
    }
  }
});


export let apiModel = new APIModel([
  opNoParams,
  opWithParams
], '/base/');
