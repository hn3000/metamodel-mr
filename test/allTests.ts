
import * as loaderTests from "./loader-test";

import {
  TestAsync,
  TestDescription
} from "@hn3000/tsunit-async";


function parmNum(t: TestDescription) {
  return (null != t.parameterSetNumber) ? `[${t.parameterSetNumber}]` : '';
}

export async function runTests() {
  "use strict";

  try {
    let test = new TestAsync(loaderTests);

    let result = await test.runAsync();
    //console.log(result);

    if (result.errors.length) {
      console.log('---');
      result.errors.forEach((e) => {
        console.log(`Failed: ${e.testName}.${e.funcName}${parmNum(e)} - ${e.message}`);
      });
      console.log('---');
      console.log(`ran unit tests, ${result.passes.length} passed, ${result.errors.length} failed`);
    } else {
      let testnames = result.passes.map((x) => `${x.testName}.${x.funcName}${parmNum(x)}`).join('\n');
      console.log('---');
      console.log(testnames);
      console.log('---');
      console.log(`ran unit tests, all ${result.passes.length} tests passed`);
    }
  }
  catch (e) {
    console.log(e);
  }
}

runTests();
