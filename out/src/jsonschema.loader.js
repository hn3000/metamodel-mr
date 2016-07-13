"use strict";
var json_ref_1 = require('@hn3000/json-ref');
var fetch = require('isomorphic-fetch');
exports.jsonSchemaLoader = {
    fetch: function (load) {
        console.log("fetch", load);
        var processor = new json_ref_1.JsonReferenceProcessor(fetcher);
        return processor.expandRef(load.address).then(function (x) {
            return JSON.stringify(x);
        });
    },
    instantiate: function (load) {
        console.log("instantiate", load);
        return JSON.parse(load.source);
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.jsonSchemaLoader;
function fetcher(url) {
    var promise = fetch(url);
    return promise.then(function (response) { return response.text(); });
}
console.log("jsonschema loader created");
//# sourceMappingURL=jsonschema.loader.js.map