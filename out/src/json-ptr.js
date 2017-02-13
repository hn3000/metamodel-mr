/* /// <reference path="../typings/index.d.ts" /> */
"use strict";
var JsonPointer = (function () {
    function JsonPointer(ref, extraUnquoted) {
        if (typeof ref === 'string') {
            this._keypath = (ref || "").split('/').slice(1).map(JsonPointer.unquote);
        }
        else if (Array.isArray(ref)) {
            this._keypath = ref.slice();
        }
        else {
            this._keypath = ref._keypath.slice();
        }
        if (null != extraUnquoted) {
            this._keypath.push(extraUnquoted);
        }
    }
    JsonPointer.prototype.add = function (extraUnquoted) {
        return new JsonPointer(this, extraUnquoted);
    };
    Object.defineProperty(JsonPointer.prototype, "parent", {
        get: function () {
            var kp = this._keypath;
            var len = kp.length;
            return new JsonPointer(kp.slice(0, len - 1));
        },
        enumerable: true,
        configurable: true
    });
    JsonPointer.prototype.get = function (segment) {
        var keypath = this._keypath;
        return keypath[segment + (segment < 0 ? keypath.length : 0)];
    };
    Object.defineProperty(JsonPointer.prototype, "segments", {
        get: function () {
            return this._keypath.slice();
        },
        enumerable: true,
        configurable: true
    });
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
        var isDash = k == '-';
        if (isDash) {
            var isArray = Array.isArray(o);
            if (isArray) {
                return o[o.length];
            }
        }
        return o && o[k];
    };
    JsonPointer.prototype.getValue = function (obj) {
        return this._keypath.reduce(JsonPointer.deref, obj);
    };
    JsonPointer.prototype.setValue = function (obj, val, createPath) {
        if (createPath === void 0) { createPath = false; }
        var keys = this._keypath.slice();
        var last = keys.pop();
        var start = obj || {};
        var tmp = start;
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var k = keys_1[_i];
            if (null == tmp[k]) {
                if (createPath || null == obj) {
                    tmp[k] = {}; // we don't know if it should be an array
                }
                else {
                    tmp = null;
                    break;
                }
            }
            tmp = tmp[k];
        }
        if (null != tmp) {
            tmp[last] = val;
        }
        return start;
    };
    JsonPointer.prototype.deleteValue = function (obj) {
        var last = this.get(-1);
        var parent = this.parent.getValue(obj);
        if (null != parent) {
            delete parent[last];
        }
    };
    JsonPointer.prototype.asString = function () {
        return [''].concat(this._keypath.map(JsonPointer.quote)).join('/');
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
//# sourceMappingURL=json-ptr.js.map