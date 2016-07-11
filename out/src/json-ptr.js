/* /// <reference path="../typings/index.d.ts" /> */
"use strict";
var JsonPointer = (function () {
    function JsonPointer(ref) {
        this._keypath = (ref || "").split('/').slice(1).map(JsonPointer.unquote);
    }
    JsonPointer.unquote = function (s) {
        var result = s.replace(/~1/g, '/');
        result = result.replace(/~0/g, '~');
        return result;
    };
    JsonPointer.quote = function (s) {
        var result = s.replace(/~/g, '~0');
        result = result.replace(/\//g, '~1');
        return result;
    };
    JsonPointer.deref = function (o, k) {
        if (Array.isArray(o) && k == '-') {
            return o[o.length];
        }
        return o && o[k];
    };
    JsonPointer.prototype.getValue = function (obj) {
        return this._keypath.reduce(JsonPointer.deref, obj);
    };
    JsonPointer.prototype.asString = function () {
        return '/' + (this._keypath.map(JsonPointer.quote).join('/'));
    };
    JsonPointer.prototype.toString = function () {
        return this.asString();
    };
    Object.defineProperty(JsonPointer.prototype, "keys", {
        get: function () {
            return this._keypath;
        },
        enumerable: true,
        configurable: true
    });
    return JsonPointer;
}());
exports.JsonPointer = JsonPointer;
