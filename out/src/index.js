"use strict";
var json_ref_1 = require("@hn3000/json-ref");
var es6_promise_1 = require("es6-promise");
var fetch = require("isomorphic-fetch");
var fs = require('fs');
function jsonReferenceLoader(content) {
    var ctx = this;
    var callback = ctx.async();
    if (null == callback) {
        ctx.emitError('jsonschema loader can not work synchronously, sorry');
    }
    //ctx.emitError(`loading json ref: ${ctx.resource} ${content.substring(0,30)}`);
    var processor = new json_ref_1.JsonReferenceProcessor(fetcher.bind(null, ctx));
    processor.expandRef(ctx.resource).then(function (x) {
        var result = "module.exports=" + JSON.stringify(x) + ";";
        callback(null, result);
    }, function (err) {
        callback(err);
    });
}
exports.jsonReferenceLoader = jsonReferenceLoader;
function fetcher(ctx, x) {
    //console.error("reading ", x);
    //ctx.emitError(`loading json ref: ${x} ${ctx.resource}`);
    if (x == "") {
        var err = new Error("empty filename");
        //console.error(err);
        throw err;
    }
    if (0 == x.lastIndexOf('http://', 8) || 0 == x.lastIndexOf('https://', 8)) {
        return fetch(x, { method: 'GET' }).then(function (response) { return response.text(); });
    }
    return es6_promise_1.Promise.resolve().then(function () {
        var contents = fs.readFileSync(x, 'utf-8');
        if ('\uFEFF' === contents.charAt(0)) {
            return contents.substr(1);
        }
        return contents;
    });
}
module.exports = jsonReferenceLoader;
//# sourceMappingURL=index.js.map