"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tsunit_async_1 = require("@hn3000/tsunit-async");
function runTests() {
    "use strict";
    var test = new tsunit_async_1.Test();
    //test.addTestClass(new SomethingTest(), "SomethingTest");
    var result = test.run();
    //console.log(result);
    if (result.errors.length) {
        console.log('---');
        result.errors.forEach(function (e) {
            console.log("Failed: " + e.testName + "." + e.funcName + " - " + e.message);
        });
        console.log('---');
        console.log("ran unit tests, " + result.passes.length + " passed, " + result.errors.length + " failed");
    }
    else {
        var testnames = result.passes.map(function (x) { return x.testName + "." + x.funcName; }).join('\n');
        console.log('---');
        console.log(testnames);
        console.log('---');
        console.log("ran unit tests, all " + result.passes.length + " tests passed");
    }
}
exports.runTests = runTests;
runTests();
//# sourceMappingURL=allTests.js.map