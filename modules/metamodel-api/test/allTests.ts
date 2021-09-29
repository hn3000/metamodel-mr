import { PetStoreTest } from "./petstore.test";
import { PathUtilsTest } from "./path-utils.test";
import { ApiOperationTest } from "./api-operation.test";
import { ApiClientTest } from "./api-client.test";
import { ApiClientWithServerTest } from "./api-client.http.test";

import {
  TestAsync,
  TestDescription
} from "tsunit.external/tsUnitAsync";

function parmNum(t:TestDescription) {
  return (null != t.parameterSetNumber) ? `[${t.parameterSetNumber}]` : '';
}

export function runTests() {
  "use strict";
  let test = new TestAsync();
  test.addTestClass(new PathUtilsTest(), "PathUtilsTest");
  test.addTestClass(new PetStoreTest(), "PetStoreTest");
  test.addTestClass(new ApiOperationTest(), "ApiOperationTest");
  test.addTestClass(new ApiClientTest(), "ApiClientTest");
  test.addTestClass(new ApiClientWithServerTest(), "ApiClientWithServerTest");

  let promise = test.runAsync();
  promise.then((result) => {
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
  }).then(null, (error) => {
    console.log('caught error', error);
  });
}

runTests();
