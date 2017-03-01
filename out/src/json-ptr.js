/* /// <reference path="../typings/index.d.ts" /> */
"use strict";
function isSimpleObj(val) {
    return ((val instanceof Date)
        || (val instanceof String)
        || (val instanceof RegExp));
}
function maybeArrayIndex(val) {
    if ('-' == val)
        return true;
    var n = parseFloat(val);
    return !(isNaN(n) || Math.floor(n) !== n);
}
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
    JsonPointer.paths = function (obj, pred) {
        var result = [];
        if (typeof pred === 'function') {
            JsonPointer.walkObject(obj, function (v, p) { return (pred(v) && result.push(p.toString()), false); });
        }
        else {
            JsonPointer.walkObject(obj, function (_, p) { return (result.push(p.toString()), false); });
        }
        return result;
    };
    JsonPointer.pointers = function (obj, pred) {
        var result = [];
        if (typeof pred === 'function') {
            JsonPointer.walkObject(obj, function (v, p) { return (pred(v) && result.push(p), false); });
        }
        else {
            JsonPointer.walkObject(obj, function (_, p) { return (result.push(p), false); });
        }
        return result;
    };
    /**
     * walk obj and pass all values and their paths to the walker function
     *
     * stops decending into sub-objects if the walker returns true
     */
    JsonPointer.walkObject = function (obj, walker) {
        var queue = [];
        queue.push({ val: obj, path: new JsonPointer('') });
        while (0 != queue.length) {
            var _a = queue.shift(), val = _a.val, path = _a.path;
            var keys = Object.keys(val);
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var k = keys_1[_i];
                var thisVal = val[k];
                var thisPath = path.add(k);
                var more = !walker(thisVal, thisPath);
                var thisType = typeof (thisVal);
                if ((thisType === 'object') && more && !isSimpleObj(thisVal)) {
                    queue.push({ val: thisVal, path: thisPath });
                }
            }
        }
    };
    JsonPointer.deref = function (p, obj) {
        return new JsonPointer(p).getValue(obj);
    };
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
    JsonPointer._deref = function (o, k) {
        var isDash = k == '-';
        if (isDash) {
            var isArray = Array.isArray(o);
            if (isArray) {
                return o[o.length];
            }
        }
        return o && o[k];
    };
    JsonPointer._set = function (o, k, v) {
        var i = k;
        if ((k === '-') && Array.isArray(o)) {
            i = o.length;
        }
        o[i] = v;
    };
    JsonPointer.prototype.getValue = function (obj) {
        return this._keypath.reduce(JsonPointer._deref, obj);
    };
    JsonPointer.prototype.setValue = function (obj, val, createPath) {
        if (createPath === void 0) { createPath = false; }
        var keys = this._keypath;
        if (keys.length == 0) {
            return val;
        }
        var start = obj || (maybeArrayIndex(keys[0]) ? [] : {});
        var tmp = start;
        var i = 0;
        for (var n = keys.length - 1; i < n; ++i) {
            var k = keys[i];
            var ntmp = JsonPointer._deref(tmp, k);
            if (null == ntmp) {
                if (createPath || null == obj) {
                    ntmp = maybeArrayIndex(keys[i + 1]) ? [] : {};
                    JsonPointer._set(tmp, k, ntmp);
                }
                else {
                    tmp = null;
                    break;
                }
            }
            tmp = ntmp;
        }
        if (null != tmp) {
            JsonPointer._set(tmp, keys[i], val);
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