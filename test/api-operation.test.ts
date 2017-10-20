
import {
  ModelTypeArray,
  ModelTypeBool,
  ModelTypeNumber,
  ModelTypeObject,
  ModelTypeRegistry,
  ModelTypeString
} from '@hn3000/metamodel';
import { Operation,  } from '../src/metaapi';

import { TestClass } from 'tsunit.external/tsUnitAsync';

let modelTypes = new ModelTypeRegistry();

modelTypes.addType(new ModelTypeString('string'));
modelTypes.addType(new ModelTypeNumber('number'));
modelTypes.addType(new ModelTypeBool('boolean'));
modelTypes.addArrayType(modelTypes.itemType('string'));
modelTypes.addObjectType('response'); // empty object type matches any (ignores all contents)

let paramsType = modelTypes.addObjectType('requestParams')
  .addItem('q', modelTypes.type('string'), true)
  .addItem('a', new ModelTypeArray(modelTypes.type('string')), true)
  .addItem('b', new ModelTypeArray(modelTypes.type('string')), true)
  .addItem('corpus',
    modelTypes.addObjectType('bodyParam')
    .addItem('a', modelTypes.type('number'), true)
    .addItem('b', modelTypes.type('number'), true)
    , true)
  .addItem('caput', new ModelTypeArray(modelTypes.type('string')), true)
  .addItem('param', modelTypes.type('string'), true)
  ;
paramsType.itemType('q').propSet('schema', { in: 'query' });
paramsType.itemType('a').propSet('schema', { format: 'multi', in: 'query' });
paramsType.itemType('b').propSet('schema', { format: 'csv', in: 'query' });
paramsType.itemType('corpus').propSet('schema', { in: 'body' });
paramsType.itemType('caput').propSet('schema', { in: 'header' });
paramsType.itemType('param').propSet('schema', { in: 'path' });

export class ApiOperationTest extends TestClass {

  private opWithParams: Operation<any, any>;
  private opNoParams: Operation<any, any>;

  setUp() {
    debugger;
    let paramsType = modelTypes.type('requestParams');

    let op = new Operation({
      id: 'withParams',
      pathPattern: '/op/{param}',
      responseModel: { 200: modelTypes.type('response') },
      requestModel: {
        format: 'empty',
        paramsType,
        paramsByLocation: {
          query: [ 'q', 'a', 'b' ],
          body: ['corpus'],
          header: ['caput']
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

    this.opWithParams = op;

    op = new Operation({
      id: 'noParams',
      pathPattern: '/op-no-params/',
      responseModel: { 200: modelTypes.type('response')},
      requestModel: {
        format: 'empty',
        paramsType,
        locationsByParam: {},
        paramsByLocation: {}
      }
    });
    this.opNoParams = op;
  }

  testParametersInUrlAreReplaced() {
    let { opWithParams } = this;

    this.areIdentical('/op/true', opWithParams.path({ param: true }));
  }
  testParametersInQueryAreReplaced() {
    let { opWithParams } = this;

    this.areIdentical('/op/true', opWithParams.path({ param: true }));

    this.areIdentical('?q=123&a=1&a=2&a=3&b=4,5,6', opWithParams.query({ q: 123, a: [1,2,3], b: [4,5,6] }));
  }
  testBodyIsFilledWithTheBodyParameter() {
    let { opWithParams } = this;

    this.areIdentical('/op/true', opWithParams.path({ param: true }));

    this.areIdentical('{"a":1,"b":2}', opWithParams.body({ caput: 123, corpus: {a:1,b:2} }));
  }
  testHeadersAreFilledFromParameters() {
    let { opWithParams } = this;

    this.areIdentical('/op/true', opWithParams.path({ param: true }));

    let expected = '{"caput":"123","Content-Type":"application/json"}';
    let actual = JSON.stringify(opWithParams.headers({ caput: 123, corpus: {a:1,b:2} }));
    this.areIdentical(expected, actual);
  }
  testEmptyQueryDoesNotHAveQuestionMark() {
    let { opNoParams } = this;
    try {
      this.areIdentical('/op-no-params/', opNoParams.path({ param: true }));
      this.areIdentical('', opNoParams.query({ q: 123, a: [1,2,3], b: [4,5,6] }));
    } catch (xx) {
      //console.log(xx);
      throw xx;
      //this.isTrue(false);
    }
  }
}