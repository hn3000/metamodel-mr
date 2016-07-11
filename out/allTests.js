"use strict";
var loaderTest = require("./loader-test");
var tsunit_async_1 = require("@hn3000/tsunit-async");
function parmNum(t) {
    return (null != t.parameterSetNumber) ? "[" + t.parameterSetNumber + "]" : '';
}
function runTests() {
    "use strict";
    var test = new tsunit_async_1.TestAsync(loaderTest);
    var promise = test.runAsync();
    promise.then(function (result) {
        //console.log(result);
        if (result.errors.length) {
            console.log('---');
            result.errors.forEach(function (e) {
                console.log("Failed: " + e.testName + "." + e.funcName + parmNum(e) + " - " + e.message);
            });
            console.log('---');
            console.log("ran unit tests, " + result.passes.length + " passed, " + result.errors.length + " failed");
        }
        else {
            var testnames = result.passes.map(function (x) { return (x.testName + "." + x.funcName + parmNum(x)); }).join('\n');
            console.log('---');
            console.log(testnames);
            console.log('---');
            console.log("ran unit tests, all " + result.passes.length + " tests passed");
        }
    });
}
exports.runTests = runTests;
runTests();
//# sourceMappingURL=allTests.js.map