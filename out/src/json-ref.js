/* /// <reference path="../typings/index.d.ts" /> */
"use strict";
var json_ptr_1 = require('./json-ptr');
var JsonReference = (function () {
    function JsonReference(ref) {
        var filename = JsonReference.getFilename(ref);
        var pointer = (ref && ref.substring(filename.length + 1)) || "";
        this._pointer = new json_ptr_1.JsonPointer(decodeURIComponent(pointer));
        this._filename = filename;
    }
    JsonReference.getFilename = function (ref) {
        var filename = "";
        if (ref != null) {
            var hashPos = ref.indexOf('#');
            if (-1 != hashPos) {
                filename = ref.substring(0, hashPos);
            }
            else {
                filename = ref;
            }
        }
        return filename;
    };
    Object.defineProperty(JsonReference.prototype, "filename", {
        get: function () {
            return this._filename;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(JsonReference.prototype, "pointer", {
        get: function () {
            return this._pointer;
        },
        enumerable: true,
        configurable: true
    });
    JsonReference.prototype.toString = function () {
        return this._filename + '#' + this._pointer;
    };
    return JsonReference;
}());
exports.JsonReference = JsonReference;
//# sourceMappingURL=json-ref.js.map