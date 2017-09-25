"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var api_1 = require("./api");
var metamodel_1 = require("@hn3000/metamodel");
var APISuccess = /** @class */ (function () {
    function APISuccess(result) {
        this.result = result;
    }
    APISuccess.prototype.isSuccess = function () { return true; };
    APISuccess.prototype.success = function () { return this.result; };
    APISuccess.prototype.error = function () { return null; };
    return APISuccess;
}());
exports.APISuccess = APISuccess;
var APICallMismatch = /** @class */ (function () {
    function APICallMismatch(ctx) {
        this._messages = ctx.messages;
        this._error = new Error('parameter validation failed');
        this._error.messages = this._messages;
    }
    APICallMismatch.prototype.isSuccess = function () { return false; };
    APICallMismatch.prototype.success = function () { return null; };
    APICallMismatch.prototype.error = function () { return this._error; };
    APICallMismatch.prototype.messages = function () { return this._messages; };
    APICallMismatch.prototype.toString = function () {
        return this._messages;
    };
    return APICallMismatch;
}());
exports.APICallMismatch = APICallMismatch;
var APIFailure = /** @class */ (function () {
    function APIFailure(error) {
        this._error = error;
    }
    APIFailure.prototype.isSuccess = function () { return false; };
    APIFailure.prototype.success = function () { return null; };
    APIFailure.prototype.error = function () { return this._error; };
    return APIFailure;
}());
exports.APIFailure = APIFailure;
var MetaApiClient = /** @class */ (function () {
    function MetaApiClient(apiModel, baseUrl) {
        this._apiModel = apiModel;
        this._baseUrl = baseUrl;
    }
    /**
     *
     * @param id of the operation
     * @param req
     *
     * @result will reject to an IAPIError in case of errors
     */
    MetaApiClient.prototype.runOperationById = function (id, req) {
        var operation = this._apiModel.operationById(id);
        if (null == operation) {
            return Promise.reject({
                kind: api_1.ErrorKind.InvalidOperation,
                httpStatus: null,
                error: null
            });
        }
        return this.runOperation(operation, req);
    };
    /**
     *
     * @param operation
     * @param req
     *
     * @result will reject to an IAPIError in case of errors
     */
    MetaApiClient.prototype.runOperation = function (operation, req) {
        var _this = this;
        var method = operation.method, requestModel = operation.requestModel;
        var ctx = new metamodel_1.ModelParseContext(req, requestModel.paramsType);
        requestModel.paramsType.validate(ctx);
        if (ctx.hasMessagesForCurrentValue()) {
            return Promise.resolve(new APICallMismatch(ctx));
        }
        var url = this._baseUrl + operation.path(req);
        //let body = operation.(req);
        var body = this._body(operation, req);
        var headers = this._headers(operation, req);
        return (fetch(url, { headers: headers, body: body })
            .then(function (result) { return Promise.all([result, result.json()]); })
            .then(function (_a) {
            var result = _a[0], json = _a[1];
            return _this._verify(result, json, operation);
        })
            .then(function (json) { return (new APISuccess(json)); })
            .then(null, function (error) { return new APIFailure(error); }));
    };
    MetaApiClient.prototype._verify = function (result, json, operation) {
        var resultType = operation.responseModel[result.status];
        var ctx = new metamodel_1.ModelParseContext(json, json);
        resultType.validate(ctx);
        if (ctx.messages.length) {
            var error = new Error('invalid response received');
            error['validation'] = ctx;
            error['messages'] = ctx.messages;
            throw error;
        }
        return json;
    };
    MetaApiClient.prototype._body = function (operation, req) {
        var format = operation.requestModel.format;
        var paramsByLocation = operation.requestModel.paramsByLocation;
        var result = null;
        if (null != paramsByLocation.body) {
            var bodyParams = paramsByLocation.body;
            result = JSON.stringify(req[bodyParams[0]]);
        }
        else if (null != paramsByLocation.formData) {
            var formParams = paramsByLocation.formData;
            result = '';
            for (var _i = 0, formParams_1 = formParams; _i < formParams_1.length; _i++) {
                var p = formParams_1[_i];
                if (0 !== result.length) {
                    result += '&';
                }
                result += p + "=" + req[p]; // TODO: proper quoting
            }
        }
        return result;
    };
    MetaApiClient.prototype._headers = function (operation, req) {
        var headers = {};
        var vars = operation.requestModel.paramsByLocation['header'];
        for (var _i = 0, vars_1 = vars; _i < vars_1.length; _i++) {
            var v = vars_1[_i];
            headers[v] = req[v];
        }
        if (operation.requestModel.paramsByLocation['body']) {
            headers['Content-Type'] = 'application/json';
        }
        else if (operation.requestModel.paramsByLocation['formData']) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        return headers;
    };
    return MetaApiClient;
}());
exports.MetaApiClient = MetaApiClient;
//# sourceMappingURL=metaapiclient.js.map