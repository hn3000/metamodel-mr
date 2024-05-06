import { PetStoreTest } from "./petstore.test";
import { PathUtilsTest } from "./path-utils.test";
import { ApiOperationTest } from "./api-operation.test";
import { ApiClientTest } from "./api-client.test";
import { ApiClientWithServerTest } from "./api-client.http.test";

import {
  TestAsync,
  TestDescription
} from "@hn3000/tsunit-async";

function parmNum(t:TestDescription) {
  return (null != t.parameterSetNumber) ? `[${t.parameterSetNumber}]` : '';
}

export function runTests() {
  "use strict";
  let test = new TestAsync();
  console.log("setting up tests");
  test.addTestClass(new PathUtilsTest(), "PathUtilsTest");
  console.log("set up PathUtilsTest");
  test.addTestClass(new PetStoreTest(), "PetStoreTest");
  console.log("set up PetStoreTest");
  test.addTestClass(new ApiOperationTest(), "ApiOperationTest");
  console.log("set up ApiOperationTest");
  test.addTestClass(new ApiClientTest(), "ApiClientTest");
  console.log("set up ApiClientTest");
  test.addTestClass(new ApiClientWithServerTest(), "ApiClientWithServerTest");
  console.log("set up ApiClientWithServerTest");

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
