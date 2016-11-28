/* /// <reference path="../typings/index.d.ts" /> */
"use strict";
var es6_promise_1 = require("es6-promise");
var json_ref_1 = require("./json-ref");
var JsonReferenceProcessor = (function () {
    function JsonReferenceProcessor(fetch) {
        this._adjusterCache = {};
        this._fetch = fetch;
        this._cache = {};
        this._contents = {};
    }
    JsonReferenceProcessor.prototype.fetchRef = function (url, base) {
        var _this = this;
        var ref = new json_ref_1.JsonReference(url);
        var contentPromise = this._fetchContent(ref.filename, base);
        return contentPromise
            .then(function (x) {
            //console.log("fetching refs for ", x, ref.filename);
            return _this._fetchRefs(x, ref.filename).then(function () { return x; });
        });
    };
    JsonReferenceProcessor.prototype.expandRef = function (url) {
        var _this = this;
        return this.fetchRef(url)
            .then(function (x) {
            // at this point all referenced files should be in _cache
            //console.log("expanding refs for ", x, ref.filename);
            return _this._expandRefs(url);
        });
    };
    JsonReferenceProcessor.prototype.expandDynamic = function (obj, ref) {
        return this._expandDynamic(obj, ref.toString());
    };
    JsonReferenceProcessor.prototype._expandRefs = function (url, base) {
        var ref = new json_ref_1.JsonReference(url);
        var filename = this._adjustUrl(ref.filename, base);
        if (!filename) {
            throw new Error('invalid reference: no file');
        }
        if (!this._contents.hasOwnProperty(filename)) {
            throw new Error("file not found in cache: " + filename);
        }
        var json = this._expandDynamic(this._contents[filename], filename);
        var obj = ref.pointer.getValue(json);
        if (null != obj && typeof obj === 'object') {
            return this._expandDynamic(obj, filename, null, []);
        }
        if (null == obj) {
            return {
                "$$ref": ref.toString(),
                "$$filenotfound": json == null,
                "$$refnotfound": obj == null
            };
        }
        return obj;
    };
    JsonReferenceProcessor.prototype._expandDynamic = function (obj, filename, base, keypath) {
        var _this = this;
        if (keypath === void 0) { keypath = []; }
        var url = this._adjustUrl(filename, base);
        if (obj && obj.hasOwnProperty && obj.hasOwnProperty("$ref")) {
            return this._expandRefs(obj["$ref"], url);
        }
        else {
            if (null == obj) {
                var error = null;
                try {
                    throw new Error("here is a stacktrace");
                }
                catch (xx) {
                    error = xx;
                }
            }
        }
        var result = obj;
        if (null != obj && typeof obj === 'object') {
            if (Array.isArray(obj)) {
                result = obj.map(function (x, ix) { return _this._expandDynamic(x, url, null, keypath.concat(['' + ix])); });
            }
            else {
                result = {};
                var keys = Object.keys(obj);
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var k = keys_1[_i];
                    //console.log("define property", k, result);
                    Object.defineProperty(result, k, {
                        enumerable: true,
                        get: (function (obj, k) { return _this._expandDynamic(obj[k], url, null, keypath.concat([k])); }).bind(this, obj, k)
                    });
                }
            }
        }
        return result;
    };
    JsonReferenceProcessor.prototype.visitRefs = function (x, visitor) {
        var queue = [];
        //console.log('findRefs',x);
        if (x != null) {
            queue.push({ e: x, p: [] });
        }
        while (0 != queue.length) {
            var thisOne = queue.shift();
            var ref = thisOne.e["$ref"];
            if (null != ref) {
                visitor(thisOne.e.$ref, thisOne.e, thisOne.p);
            }
            else if (typeof thisOne.e === 'object') {
                var keys = Object.keys(thisOne.e);
                for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
                    var k = keys_2[_i];
                    if (thisOne.e[k]) {
                        queue.push({ e: thisOne.e[k], p: thisOne.p.concat([k]) });
                    }
                }
            }
        }
    };
    JsonReferenceProcessor.prototype.findRefs = function (x) {
        var result = [];
        this.visitRefs(x, function (r, e, p) { return result.push(r); });
        //console.log('findRefs done', x, result);
        return result;
    };
    JsonReferenceProcessor.prototype._fetchContent = function (urlArg, base) {
        var _this = this;
        var url = this._adjustUrl(urlArg, base);
        if (this._cache.hasOwnProperty(url)) {
            return this._cache[url];
        }
        var result = es6_promise_1.Promise.resolve(url)
            .then(function (u) { return _this._fetch(u); })
            .then(function (x) { return (typeof x === 'string') ? jsonParse(x) : x; })
            .then(function (x) { return (_this._contents[url] = x, x); }, function (err) { return (_this._contents[url] = null, null); });
        this._cache[url] = result;
        return result;
    };
    JsonReferenceProcessor.prototype._adjustUrl = function (url, base) {
        return this._urlAdjuster(base)(url);
    };
    JsonReferenceProcessor.prototype._urlAdjuster = function (base) {
        if (null != base) {
            var hashPos = base.indexOf('#');
            var theBase_1 = (hashPos === -1) ? base : base.substring(0, hashPos);
            theBase_1 = normalizePath(theBase_1);
            if (null != this._adjusterCache[theBase_1]) {
                return this._adjusterCache[theBase_1];
            }
            var slashPos = theBase_1.lastIndexOf('/');
            if (-1 == slashPos) {
                slashPos = theBase_1.lastIndexOf('\\');
            }
            var result = null;
            if (-1 != slashPos) {
                var prefix_1 = theBase_1.substring(0, slashPos + 1);
                result = function (x) {
                    if (null == x || x === "") {
                        return theBase_1;
                    }
                    if ('/' === x.substring(0, 1)) {
                        return x;
                    }
                    //console.error("urlAdjuster", x, base, '->',prefix+x);
                    /*if (base === x) {
                      console.error("base == url", new Error());
                    }*/
                    return normalizePath(prefix_1 + x);
                };
            }
            else {
                result = function (x) {
                    if (null == x || x === "") {
                        return theBase_1;
                    }
                    return x;
                };
            }
            this._adjusterCache[theBase_1] = result;
            return result;
        }
        return function (x) { return x; };
    };
    JsonReferenceProcessor.prototype._fetchRefs = function (x, base) {
        var _this = this;
        var adjuster = this._urlAdjuster(base);
        var refs = this.findRefs(x);
        //console.log("found refs ", refs);
        var files = refs.map(function (x) { return adjuster(json_ref_1.JsonReference.getFilename(x)); });
        var filesHash = files.reduce(function (c, f) { c[f] = f; return c; }, {});
        files = Object.keys(filesHash);
        //console.log("found files ", refs, files, " fetching ...");
        var needThen = files.some(function (p) { return !_this._contents.hasOwnProperty(p); });
        var filesPromises = files.map(function (p) { return _this._fetchContent(p); });
        //console.log("got promises ", filesPromises);
        var promise = es6_promise_1.Promise.all(filesPromises);
        if (needThen) {
            return promise.then(this._fetchRefsAll.bind(this, files));
        }
        return promise;
    };
    JsonReferenceProcessor.prototype._fetchRefsAll = function (files, x) {
        var result = [];
        for (var i = 0, n = x.length; i < n; ++i) {
            result.push(this._fetchRefs(x[i], files[i]));
        }
        return es6_promise_1.Promise.all(result);
    };
    return JsonReferenceProcessor;
}());
exports.JsonReferenceProcessor = JsonReferenceProcessor;
function jsonParse(x) {
    var result;
    try {
        result = JSON.parse(x);
    }
    catch (xx) {
        var nocomments = removeComments(x);
        result = JSON.parse(nocomments);
    }
    return result;
}
exports.jsonParse = jsonParse;
var singleLineCommentRE = /\/\/.*$/gm;
var multiLineCommentRE = /\/\*(.|[\r\n])*?\*\//g;
var CommentKind;
(function (CommentKind) {
    CommentKind[CommentKind["NONE"] = 0] = "NONE";
    CommentKind[CommentKind["SINGLELINE"] = 1] = "SINGLELINE";
    CommentKind[CommentKind["MULTILINE"] = 2] = "MULTILINE";
    CommentKind[CommentKind["BOTH"] = 3] = "BOTH";
})(CommentKind = exports.CommentKind || (exports.CommentKind = {}));
function removeComments(jsonString, kinds) {
    if (kinds === void 0) { kinds = CommentKind.BOTH; }
    var result = jsonString;
    if (kinds & CommentKind.SINGLELINE) {
        result = result.replace(singleLineCommentRE, '');
    }
    if (kinds & CommentKind.MULTILINE) {
        result = result.replace(multiLineCommentRE, '');
    }
    return result;
}
exports.removeComments = removeComments;
var redundantDotRE = /[/][.][/]/g;
var redundantDotDotRE = /(^|[/])[^/.]+[/][.][.][/]/g;
function normalizePath(path) {
    var result = replaceWhileFound(path, redundantDotRE, '/');
    result = replaceWhileFound(result, redundantDotDotRE, '/');
    return result;
}
exports.normalizePath = normalizePath;
function replaceWhileFound(input, re, replacement) {
    var result = input;
    var done = false;
    while (!done) {
        var replaced = result.replace(re, replacement);
        if (replaced === result) {
            done = true;
        }
        result = replaced;
    }
    return result;
}
//# sourceMappingURL=json-ref-processor.js.map