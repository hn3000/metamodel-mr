
import {
  Test
} from '@hn3000/tsunit-async'

import { TemplateTest } from './template-test';

export function runTests() {
  "use strict";
  let test = new Test();
  test.addTestClass(new TemplateTest(), "TemplateTest");

  let result = test.run();
  //console.log(result);

  if (result.errors.length) {
    console.log('---');
    result.errors.forEach((e)=>{
      console.log(`Failed: ${e.testName}.${e.funcName} - ${e.message}`);
    });
    console.log('---');
    console.log(`ran unit tests, ${result.passes.length} passed, ${result.errors.length} failed`);
  } else {
    let testnames = result.passes.map((x)=>`${x.testName}.${x.funcName}`).join('\n');
    console.log('---');
    console.log(testnames);
    console.log('---');
    console.log(`ran unit tests, all ${result.passes.length} tests passed`);
  }
}

runTests();
