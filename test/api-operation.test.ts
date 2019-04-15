import { opNoParams, opWithParams } from "./util-model";
import { Operation } from "../src/export";
import { TestClass } from "tsunit.external";


export class ApiOperationTest extends TestClass {

  constructor() {
    super();
  }

  private opWithParams: Operation<any, any>;
  private opNoParams: Operation<any, any>;

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
}
