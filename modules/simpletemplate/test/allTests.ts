
import {
  Test, TestClass
} from '@hn3000/tsunit-async'

import { TemplateTest } from './template-test';

export function runTests() {
  "use strict";
  let test = new Test();
  test.addTestClass(new TestResultPrinter(), "TestResultPrinter");
  test.addTestClass(new TemplateTest(), "TemplateTest");

  let result = test.run();
  //console.log(result);
  printResults(console, result);
}

interface IConsole {
  log(msg: string, ...args: any[]): void;
}

class DummyConsole implements IConsole {
  calls: { msg: string, args: any[] }[] = [];

  log(msg: string, ...args: any[]) {
    this.calls.push({ msg, args });
  }
}

class TestResultPrinter extends TestClass {

  testPrintsErrors() {
    const test = new Test();
    test.errors = [
      { funcName: 'func', message: 'msg', testName: 'tstNm', parameterSetNumber: null }
    ];
    test.passes = [];

    const dummyOut = new DummyConsole();
    printResults(dummyOut, test);
    this.areIdentical(dummyOut.calls.length, 4);
    this.areIdentical(dummyOut.calls[1].msg, "Failed: tstNm.func - msg");
  }
  testPrintsResult() {
    const test = new Test();
    test.errors = [];
    test.passes = [
      { funcName: 'func', message: 'msg', testName: 'tstNm', parameterSetNumber: null }
    ];

    const dummyOut = new DummyConsole();
    printResults(dummyOut, test);
    this.areIdentical(dummyOut.calls.length, 4);
    this.areIdentical(dummyOut.calls[1].msg, "tstNm.func");
  }
  testDummyConsole() {
    const dummyOut = new DummyConsole();
    dummyOut.log("msg", 1,2);
    this.areIdentical(1, dummyOut.calls.length);
    this.areIdentical('msg', dummyOut.calls[0].msg);
    this.areCollectionsIdentical([1,2], dummyOut.calls[0].args);
  }
}

function printResults(out: IConsole, result: Test) {
  if (result.errors.length) {
    out.log('---');
    result.errors.forEach((e)=>{
      out.log(`Failed: ${e.testName}.${e.funcName} - ${e.message}`);
    });
    out.log('---');
    out.log(`ran unit tests, ${result.passes.length} passed, ${result.errors.length} failed`);
  } else {
    let testnames = result.passes.map((x)=>`${x.testName}.${x.funcName}`).join('\n');
    out.log('---');
    out.log(testnames);
    out.log('---');
    out.log(`ran unit tests, all ${result.passes.length} tests passed`);
  }
}

runTests();
