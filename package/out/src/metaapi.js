"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var json_ref_1 = require("@hn3000/json-ref");
var metamodel_1 = require("@hn3000/metamodel");
var simpletemplate_1 = require("@hn3000/simpletemplate");
var fetch = require("isomorphic-fetch");
var templateFactory = new simpletemplate_1.TemplateFactory({ pattern: '{X}' });
var APIModel = /** @class */ (function () {
    function APIModel(operations, base) {
        this._operations = operations.slice();
        this._base = base;
        this._operationsById = {};
        var opsById = this._operationsById;
        for (var _i = 0, _a = this._operations; _i < _a.length; _i++) {
            var op = _a[_i];
            if (opsById[op.id]) {
                console.log("duplicate id for operation " + op.id + ": " + opsById[op.id] + " " + op);
            }
            opsById[op.id] = op;
        }
    }
    Object.defineProperty(APIModel.prototype, "base", {
        get: function () {
            return this._base;
        },
        enumerable: true,
        configurable: true
    });
    APIModel.prototype.operations = function () {
        return Object.freeze(this._operations);
    };
    APIModel.prototype.operationById = function (id) {
        return this._operationsById[id];
    };
    APIModel.prototype.subModel = function (keys) {
        var _this = this;
        return new APIModel(keys.map(function (k) { return _this._operationsById[k]; }), this._base);
    };
    APIModel.prototype.add = function (op) {
        this._operationsById[op.id] = op;
        return this;
    };
    APIModel.prototype.remove = function (id) {
        var op = this._operationsById[id];
        if (null != op) {
            var index = this._operations.indexOf(op);
            if (-1 != index) {
                this._operations.splice(index, 1);
            }
            delete this._operationsById[id];
        }
        return this;
    };
    APIModel.prototype.setBase = function (base) {
        this._base = base;
    };
    return APIModel;
}());
exports.APIModel = APIModel;
var APIModelRegistry = /** @class */ (function () {
    function APIModelRegistry(fetchFun) {
        this._schemas = new metamodel_1.ModelSchemaParser();
        this._fetchFun = fetchFun || fetchFetcher;
        this._jsonRefProcessor = new json_ref_1.JsonReferenceProcessor(this._fetchFun);
    }
    APIModelRegistry.prototype.parseParameterType = function (opSpec, id) {
        var _this = this;
        var result = {
            format: "empty",
            locationsByParam: {},
            paramsByLocation: {}
        };
        var parameters = opSpec.parameters;
        if (null == parameters || 0 === parameters.length) {
            return result;
        }
        var composite = new metamodel_1.ModelTypeObject(id + "Params");
        result.paramsType = composite;
        var locationByParam = result.locationsByParam;
        var paramsByLocation = result.paramsByLocation;
        parameters.forEach(function (p) {
            var name = p.name, required = p.required;
            if (paramsByLocation[p.in] == null) {
                paramsByLocation[p.in] = [name];
            }
            else {
                paramsByLocation[p.in].push(name);
            }
            locationByParam[name] = p.in;
            var type = null;
            if (p.in === 'body') {
                var schema = p.schema;
                type = _this._schemas.addSchemaObject(id + "Body", schema);
            }
            else if (p.in === 'formData') {
                var pp = p;
                type = _this._schemas.addSchemaObject(id + "-" + name, pp);
            }
            else if (p.in === 'query') {
                var pp = p;
                type = _this._schemas.addSchemaObject(id + "-" + name, pp);
            }
            else if (p.in === 'header') {
                var pp = p;
                type = _this._schemas.addSchemaObject(id + "-" + name, pp);
            }
            else {
                var pp = p;
                type = _this._schemas.itemType(pp.type);
            }
            if (type != null) {
                composite.addItem(name, type, required);
            }
        });
        if (paramsByLocation['body'] != null && 1 < paramsByLocation['body'].length) {
            console.log("multiple in: body parameters found: " + paramsByLocation['body'].join(',') + ", " + name);
        }
        if (paramsByLocation['body'] && paramsByLocation['formData']) {
            console.log("both in: body and in: formData parameters found: " + paramsByLocation['body'].join(',') + "; " + paramsByLocation['formData'].join(',') + ", " + name);
        }
        return result;
    };
    APIModelRegistry.prototype.parseAPIDefinition = function (spec, id) {
        var _this = this;
        var operations = [];
        json_ref_1.JsonPointer.walkObject(spec, function (x, p) {
            var keys = p.keys;
            if (keys.length < 1) {
                return true;
            }
            if ('paths' === keys[0]) {
                if (3 < keys.length) {
                    return true;
                }
                if (3 == keys.length) {
                    var opSpec = x;
                    var pathPattern = keys[1];
                    var method = keys[2];
                    var id_1 = opSpec.operationId || pathPattern + '_' + method;
                    var requestModel = _this.parseParameterType(opSpec, id_1);
                    var responseModel = {
                        '200': _this._schemas.type('any')
                    };
                    for (var _i = 0, _a = Object.keys(opSpec.responses); _i < _a.length; _i++) {
                        var status_1 = _a[_i];
                        var typename = id_1 + "Response" + status_1;
                        var response = opSpec.responses[status_1];
                        var schema = response && response.schema;
                        if (null != schema) {
                            responseModel[status_1] = _this._schemas.addSchemaObject(typename, schema);
                        }
                        else {
                            responseModel[status_1] = null;
                        }
                    }
                    var pathTemplate = templateFactory.parse(pathPattern);
                    operations.push({
                        id: id_1,
                        name: id_1,
                        pathPattern: pathPattern, method: method,
                        requestModel: requestModel,
                        responseModel: responseModel,
                        path: pathTemplate.render.bind(pathTemplate)
                    });
                }
            }
            return false;
        });
        var base = spec.basePath;
        //console.log(`create APIModel ${operations}, ${base}`)
        var result = new APIModel(operations, base);
        return result;
    };
    APIModelRegistry.prototype.fetchModel = function (url, id) {
        var _this = this;
        return (
        //fetch(url)
        //.then(response => response.text())
        //.then(body => JSON.parse(body))
        this._jsonRefProcessor.expandRef(url)
            .then(function (x) { return _this.parseAPIDefinition(x, id || url); }));
    };
    APIModelRegistry.prototype.model = function (id) {
        return this._modelById[id];
    };
    return APIModelRegistry;
}());
exports.APIModelRegistry = APIModelRegistry;
function fetchFetcher(url) {
    var p = fetch(url);
    return p.then(function (r) {
        if (r.status < 300) {
            var x = r.text();
            return x;
        }
        return null;
    });
}
//# sourceMappingURL=metaapi.js.map