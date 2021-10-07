import { opNoParams, opWithParams, opWithParamsInFormData } from "./util-model";
import { Operation } from "../src/export";
import { TestClass } from "@hn3000/tsunit-async";

export class ApiOperationTest extends TestClass {

  constructor() {
    super();
  }

  private opWithParams!: Operation<any, any>;
  private opNoParams!: Operation<any, any>;

  setUp() {
    this.opNoParams = opNoParams;
    this.opWithParams = opWithParams;
  }

  testParametersInPathAreReplaced() {
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
  testEmptyQueryDoesNotHaveQuestionMark() {
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

  testFormDataIsPutInBody() {
    let op = opWithParamsInFormData;
    this.areIdentical('/op/withFormData', op.path(null));
    this.areIdentical('a=&b=&c=', op.body({a:'',b:'',c:''}));
  }
  testNoBodyParamsNoBody() {
    let op = opNoParams;
    this.areIdentical('/op-no-params/', op.path(null));
    this.areIdentical(undefined, op.body({ }));
    this.areIdentical(undefined, op.body(undefined));
  }
}
