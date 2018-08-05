"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var model_base_1 = require("./model.base");
function constructionNotAllowed() {
    throw new Error('can not use subtype for construction');
}
var ModelTypeAny = /** @class */ (function (_super) {
    __extends(ModelTypeAny, _super);
    function ModelTypeAny(name, construct, constraints) {
        var _this = _super.call(this, name, constraints) || this;
        _this._constructFun = construct || (function () { return ({}); });
        return _this;
    }
    ModelTypeAny.prototype._clone = function (constraints) {
        var result = new this.constructor(this.name, this._constructFun, constraints);
        return result;
    };
    ModelTypeAny.prototype._kind = function () { return 'any'; };
    ModelTypeAny.prototype.asItemType = function () {
        return this;
    };
    ModelTypeAny.prototype.fromString = function (text) {
        return JSON.parse(text);
    };
    ModelTypeAny.prototype.asString = function (obj) {
        return JSON.stringify(obj, null, 2);
    };
    ModelTypeAny.prototype.lowerBound = function () { return null; };
    ModelTypeAny.prototype.upperBound = function () { return null; };
    ModelTypeAny.prototype.possibleValues = function () { return null; };
    ModelTypeAny.prototype.create = function () {
        return this._constructFun ? this._constructFun() : {};
    };
    ModelTypeAny.prototype.parse = function (ctx) {
        if (ctx.currentRequired() && null == ctx.currentValue()) {
            ctx.addError('required value is missing', 'required-empty');
        }
        return this._checkAndAdjustValue(ctx.currentValue(), ctx);
    };
    ModelTypeAny.prototype.validate = function (ctx) {
        this.parse(ctx);
    };
    ModelTypeAny.prototype.unparse = function (val) {
        return val;
    };
    return ModelTypeAny;
}(model_base_1.ModelTypeConstrainable));
exports.ModelTypeAny = ModelTypeAny;
var ModelTypeObject = /** @class */ (function (_super) {
    __extends(ModelTypeObject, _super);
    function ModelTypeObject(name, construct, constraints) {
        var _this = _super.call(this, name, constraints) || this;
        _this._allowAdditional = true;
        _this._constructFun = construct || (function () { return ({}); });
        _this._entries = [];
        _this._entriesByName = {};
        return _this;
    }
    ModelTypeObject.prototype._clone = function (constraints) {
        var result = new this.constructor(this.name, this._constructFun, constraints);
        for (var _i = 0, _a = this._entries; _i < _a.length; _i++) {
            var e = _a[_i];
            result.addItem(e.key, e.type, e.required);
        }
        result._allowAdditional = this._allowAdditional;
        return result;
    };
    ModelTypeObject.prototype.addItem = function (key, type, required) {
        if (null == key) {
            throw new Error("addItem requires valid key, got " + key + " and type " + type);
        }
        if (null == type) {
            throw new Error("addItem requires valid type, got " + type + " for key " + key);
        }
        if (null == this._entriesByName[key]) {
            var entry = {
                key: key, type: type, required: required
            };
            this._entries.push(entry);
            this._entriesByName[key] = entry;
        }
        return this;
    };
    ModelTypeObject.prototype.extend = function (type) {
        var constraints = type.findConstraints(function () { return true; });
        var result = this.withConstraints.apply(this, constraints);
        for (var _i = 0, _a = type.items; _i < _a.length; _i++) {
            var item = _a[_i];
            var key = item.key, type_1 = item.type, required = item.required;
            result.addItem(key, type_1, required);
        }
        return result;
    };
    ModelTypeObject.prototype.asItemType = function () {
        return null;
    };
    ModelTypeObject.prototype.itemType = function (name) {
        if (typeof name === 'string' || typeof name === 'number') {
            var entry = this._entriesByName[name];
            return entry && entry.type;
        }
        return null;
    };
    ModelTypeObject.prototype.slice = function (names) {
        if (Array.isArray(names)) {
            var filteredConstraints = this._getConstraints().slice(names);
            var result = new ModelTypeObject(this.name + "[" + names.join(',') + "]", this._constructFun, filteredConstraints); // constructionNotAllowed ?
            for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                var name = names_1[_i];
                var entry = this._entriesByName[name];
                if (entry) {
                    result.addItem('' + name, entry.type, entry.required);
                }
            }
            return result;
        }
        return null;
    };
    Object.defineProperty(ModelTypeObject.prototype, "items", {
        get: function () {
            return this._entries;
        },
        enumerable: true,
        configurable: true
    });
    ModelTypeObject.prototype.parse = function (ctx) {
        var result = this.create();
        var val = ctx.currentValue();
        var keys = [];
        if (this._allowAdditional && val) {
            keys = Object.keys(val);
        }
        for (var _i = 0, _a = this._entries; _i < _a.length; _i++) {
            var e = _a[_i];
            ctx.pushItem(e.key, e.required, e.type);
            result[e.key] = e.type.parse(ctx);
            var kp = keys.indexOf(e.key);
            if (-1 != kp) {
                keys.splice(kp, 1);
            }
            ctx.popItem();
        }
        if (keys.length) {
            for (var _b = 0, keys_1 = keys; _b < keys_1.length; _b++) {
                var k = keys_1[_b];
                result[k] = val[k];
            }
        }
        result = this._checkAndAdjustValue(result, ctx);
        return result;
    };
    ModelTypeObject.prototype.validate = function (ctx) {
        for (var _i = 0, _a = this._entries; _i < _a.length; _i++) {
            var e = _a[_i];
            ctx.pushItem(e.key, e.required, e.type);
            e.type.validate(ctx);
            ctx.popItem();
        }
        this._checkAndAdjustValue(ctx.currentValue(), ctx);
    };
    ModelTypeObject.prototype.unparse = function (value) {
        var result = {};
        var val = value;
        for (var _i = 0, _a = this._entries; _i < _a.length; _i++) {
            var e = _a[_i];
            var item = val[e.key];
            if (undefined !== item) {
                result[e.key] = e.type.unparse(item);
            }
        }
        return result;
    };
    ModelTypeObject.prototype.create = function () {
        return this._constructFun ? this._constructFun() : {};
    };
    // null -> no list of allowed values (no known restrictions)
    // empty array -> no values possible
    ModelTypeObject.prototype.possibleValuesForContextData = function (name, data) {
        var result = null;
        var fieldType = this.itemType(name).asItemType();
        if (fieldType) {
            result = fieldType.possibleValues();
        }
        var cx = this.findConstraints(function (c) { return null != c.possibleValuesForContextData; });
        result = cx.reduce(function (r, c) { return model_base_1.intersectArrays(r, c.possibleValuesForContextData(name, data)); }, result);
        return result;
    };
    ModelTypeObject.prototype._kind = function () { return 'object'; };
    return ModelTypeObject;
}(model_base_1.ModelTypeConstrainable));
exports.ModelTypeObject = ModelTypeObject;
function safeArray(val) {
    return Array.isArray(val) ? val.slice() : null != val ? [val] : null;
}
var ComparisonOp_Names = {
    "=": "equal",
    "==": "equal",
    "<": "less",
    "<=": "less-equal",
    ">": "greater",
    ">=": "greater-equal",
    "!=": "different"
};
function comparisonEquals(a, b) {
    if (a === b) {
        return true;
    }
    if ((null == a) != (null == b)) {
        return false;
    }
    var isArrA = Array.isArray(a);
    var isArrB = Array.isArray(b);
    if (isArrA != isArrB) {
        return false;
    }
    if (isArrA) {
        var aa = a;
        var ab = b;
        if (aa.length != ab.length) {
            return false;
        }
        for (var i = 0, n = aa.length; i < n; ++i) {
            if (aa[i] != ab[i]) {
                return false;
            }
        }
        return true;
    }
    // simple case was handled first, this means a !== b here
    return false;
}
function comparisonLess(a, b) {
    if ((null == a) != (null == b)) {
        return false;
    }
    if ((null == a) && (null == b)) {
        return false;
    }
    var isArrA = Array.isArray(a);
    var isArrB = Array.isArray(b);
    if (isArrA || isArrB) {
        return false;
    }
    return (a < b);
}
function comparisonGreater(a, b) {
    return comparisonLess(b, a);
}
function inverse(comp) {
    return function (a, b) { return !comp(a, b); };
}
var ComparisonOp_Comparator = {
    "=": comparisonEquals,
    "==": comparisonEquals,
    "<": comparisonLess,
    "<=": inverse(comparisonGreater),
    ">": comparisonGreater,
    ">=": inverse(comparisonLess),
    "!=": inverse(comparisonEquals)
};
var ModelTypeConstraintCompareProperties = /** @class */ (function (_super) {
    __extends(ModelTypeConstraintCompareProperties, _super);
    function ModelTypeConstraintCompareProperties(fieldsOrSelf, op) {
        var _this = _super.call(this) || this;
        if (Array.isArray(fieldsOrSelf) && null != op) {
            _this._fields = safeArray(fieldsOrSelf);
            _this._op = op;
            _this._comparator = ComparisonOp_Comparator[op];
        }
        else {
            var props = fieldsOrSelf;
            if (props && props.properties) {
                _this._fields = safeArray(props.properties);
                _this._op = props.op;
                _this._comparator = ComparisonOp_Comparator[props.op] || comparisonEquals;
            }
            else {
                var that = fieldsOrSelf;
                _this._fields = that._fields.slice();
                _this._op = that._op;
                _this._comparator = that._comparator;
            }
        }
        return _this;
    }
    //private _isConstraintEqualFields() {} // marker property
    ModelTypeConstraintCompareProperties.prototype._id = function () {
        return "compareFields(" + this._fields.join(',') + ", " + this._op + ")";
    };
    ModelTypeConstraintCompareProperties.prototype.checkAndAdjustValue = function (val, ctx) {
        var fields = this._fields;
        var values = fields.reduce(function (acc, k) {
            acc.push(val[k]);
            return acc;
        }, []);
        var valid = true;
        var comp = this._comparator;
        for (var i = 1, n = values.length; i < n; ++i) {
            if (!comp(values[i - 1], values[i])) {
                valid = false;
                break;
            }
        }
        var result = val;
        if (!valid) {
            for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
                var f = fields_1[_i];
                ctx.pushItem(f, !this.warnOnly(), null);
                switch (this._op) {
                    case '=':
                    case '==':
                        ctx.addErrorEx("expected fields to be equal: " + fields.join(',') + ".", 'properties-different', { value: val, values: values, fields: fields.join(',') });
                        break;
                    case '!=':
                        ctx.addErrorEx("expected fields to be different: " + fields.join(',') + ".", 'properties-equal', { value: val, values: values, fields: fields.join(',') });
                        break;
                    default:
                        ctx.addErrorEx("expected fields to be ordered (" + this._op + "): " + fields.join(',') + ".", 'properties-wrong-order-' + (ComparisonOp_Names[this._op] || this._op), { value: val, values: values, fields: fields.join(',') });
                        break;
                }
                ctx.popItem();
            }
        }
        return result;
    };
    ModelTypeConstraintCompareProperties.prototype.usedItems = function () { return this._fields; };
    return ModelTypeConstraintCompareProperties;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintCompareProperties = ModelTypeConstraintCompareProperties;
var ModelTypeConstraintEqualProperties = /** @class */ (function (_super) {
    __extends(ModelTypeConstraintEqualProperties, _super);
    function ModelTypeConstraintEqualProperties(fieldsOrSelf) {
        var _this = _super.call(this) || this;
        if (Array.isArray(fieldsOrSelf)) {
            _this._fields = fieldsOrSelf.slice();
        }
        else if (fieldsOrSelf && fieldsOrSelf.properties) {
            _this._fields = safeArray(fieldsOrSelf.properties);
        }
        else {
            _this._fields = fieldsOrSelf._fields.slice();
        }
        return _this;
    }
    ModelTypeConstraintEqualProperties.prototype._isConstraintEqualFields = function () { }; // marker property
    ModelTypeConstraintEqualProperties.prototype._id = function () {
        return "equalFields(" + this._fields.join(',') + ")";
    };
    ModelTypeConstraintEqualProperties.prototype.checkAndAdjustValue = function (val, ctx) {
        var fields = this._fields;
        var values = fields.reduce(function (acc, k) {
            if (-1 == acc.indexOf(val[k])) {
                acc.push(val[k]);
            }
            return acc;
        }, []);
        var result = val;
        if (values.length !== 1) {
            for (var _i = 0, fields_2 = fields; _i < fields_2.length; _i++) {
                var f = fields_2[_i];
                ctx.pushItem(f, !this.warnOnly(), null);
                ctx.addErrorEx("expected fields to be equal: " + fields.join(',') + ".", 'properties-different', { value: val, values: values, fields: fields.join(',') });
                ctx.popItem();
            }
        }
        return result;
    };
    ModelTypeConstraintEqualProperties.prototype.usedItems = function () { return this._fields; };
    return ModelTypeConstraintEqualProperties;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintEqualProperties = ModelTypeConstraintEqualProperties;
function createPredicateEquals(property, value, invert) {
    if (Array.isArray(value)) {
        var valueArray_1 = value.slice();
        return function (x) {
            var p = x[property];
            if (Array.isArray(p)) {
                return p.some(function (x) { return (-1 != valueArray_1.indexOf(x)) == !invert; });
            }
            return (p !== undefined) && (-1 != valueArray_1.indexOf(p)) == !invert;
        };
    }
    return function (x) {
        var p = x[property];
        if (Array.isArray(p)) {
            return ((-1 != p.indexOf(value)) == !invert);
        }
        return (p !== undefined) && (value === p) == !invert;
    };
}
function createPredicate(condition) {
    if (Array.isArray(condition)) {
        var predicates_1 = condition.map(function (c) { return createSinglePredicate(c); });
        return function (x) { return predicates_1.every(function (t) { return t(x); }); };
    }
    else {
        return createSinglePredicate(condition);
    }
}
function createSinglePredicate(condition) {
    var property = condition.property, value = condition.value, op = condition.op, invert = condition.invert;
    switch (op) {
        case undefined:
        case null:
        case '==':
        case '=': return createPredicateEquals(property, value, invert);
        case '<':
        case '<=':
        case '>':
        case '>=':
            if (invert) {
                return function (o) { return inverse(ComparisonOp_Comparator[op])(o[property], value); };
            }
            return function (o) { return ComparisonOp_Comparator[op](o[property], value); };
    }
    console.warn("unsupported condition: " + op, condition);
    return function () { return false; };
}
function createValuePredicate(possibleValues) {
    if (null == possibleValues || 0 === possibleValues.length) {
        return function (x) { return x != null; };
    }
    else if (possibleValues.length == 1) {
        var val_1 = possibleValues[0];
        return function (x) { return null == x || x == val_1; };
    }
    else {
        var valArray_1 = possibleValues;
        return function (x) { return null == x || -1 != valArray_1.indexOf(x); };
    }
}
var ModelTypeConstraintConditionalValue = /** @class */ (function (_super) {
    __extends(ModelTypeConstraintConditionalValue, _super);
    function ModelTypeConstraintConditionalValue(optionsOrSelf) {
        var _this = _super.call(this) || this;
        var options = optionsOrSelf;
        if (options.condition && options.properties) {
            var condition = options.condition, properties = options.properties, possibleValue = options.possibleValue;
            var multiple = Array.isArray(properties) && properties.length > 1;
            if (multiple && null != possibleValue && !Array.isArray(possibleValue)) {
                throw new Error("must not combine list of required fields with single possibleValue");
            }
            var props = safeArray(properties);
            var allowed = safeArray(possibleValue);
            var id_p = props.join(',');
            var id_v = allowed ? " == [" + allowed.join(',') + "]" : "";
            //let id = `conditionalValue(${condition.property} ${condition.invert?'!=':'=='} ${condition.value} -> ${id_p}${id_v})`;
            var id = "conditionalValue()";
            _this._settings = {
                predicate: createPredicate(condition),
                valueCheck: createValuePredicate(allowed),
                properties: props,
                possibleValues: allowed,
                clearOtherwise: !!options.clearOtherwise,
                id: id
            };
        }
        else if (_this._isConstraintConditionalValue == optionsOrSelf["_isConstraintConditionalValue"]) {
            _this._settings = optionsOrSelf._settings;
        }
        else {
            console.log("invalid constructor argument", optionsOrSelf);
            throw new Error("invalid constructor argument" + optionsOrSelf);
        }
        return _this;
    }
    ModelTypeConstraintConditionalValue.prototype._isConstraintConditionalValue = function () { }; // marker property
    ModelTypeConstraintConditionalValue.prototype._id = function () {
        return this._settings.id;
    };
    ModelTypeConstraintConditionalValue.prototype.checkAndAdjustValue = function (val, ctx) {
        var check = true;
        var s = this._settings;
        if (s.predicate(val)) {
            var isError = !this.isWarningOnly;
            for (var _i = 0, _a = s.properties; _i < _a.length; _i++) {
                var f = _a[_i];
                ctx.pushItem(f, isError, null);
                var thisValue = ctx.currentValue();
                var valid = s.valueCheck(thisValue);
                if (!valid) {
                    if (s.possibleValues) {
                        ctx.addMessageEx(isError, "illegal value.", 'value-illegal', { value: ctx.currentValue(), allowed: s.possibleValues });
                    }
                    else {
                        ctx.addMessage(isError, "required field not filled.", 'required-empty');
                    }
                }
                ctx.popItem();
            }
        }
        else if (s.clearOtherwise) {
            for (var _b = 0, _c = s.properties; _b < _c.length; _b++) {
                var f = _c[_b];
                delete val[f];
            }
            ctx._removeMessages(function (m) { return -1 != s.properties.indexOf(m.property); });
        }
        return val;
    };
    ModelTypeConstraintConditionalValue.prototype.possibleValuesForContextData = function (name, data) {
        var s = this._settings;
        if (null != name && s.predicate(data) && -1 != s.properties.indexOf(name.toString())) {
            return s.possibleValues;
        }
        return null;
    };
    ModelTypeConstraintConditionalValue.prototype.usedItems = function () { return this._settings.properties; };
    return ModelTypeConstraintConditionalValue;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintConditionalValue = ModelTypeConstraintConditionalValue;
/**
 * can be used for validation, only, not for value modification
 */
var ModelTypePropertyConstraint = /** @class */ (function (_super) {
    __extends(ModelTypePropertyConstraint, _super);
    function ModelTypePropertyConstraint(property, constraint) {
        var _this = _super.call(this) || this;
        _this._property = property;
        _this._constraint = constraint;
        return _this;
    }
    ModelTypePropertyConstraint.prototype._id = function () {
        return this._constraint.id + "@" + this._property;
    };
    ModelTypePropertyConstraint.prototype.checkAndAdjustValue = function (val, ctx) {
        ctx.pushItem(this._property, false, null);
        var value = ctx.currentValue();
        try {
            this._constraint.checkAndAdjustValue(value, ctx);
        }
        catch (error) {
            ctx.addMessageEx(!this.isWarningOnly, 'value had unexpected type', 'value-type', { value: value, error: error });
        }
        ctx.popItem();
        return val;
    };
    ModelTypePropertyConstraint.prototype.usedItems = function () { return [this._property]; };
    return ModelTypePropertyConstraint;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypePropertyConstraint = ModelTypePropertyConstraint;
//# sourceMappingURL=model.object.js.map