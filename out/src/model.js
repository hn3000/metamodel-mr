"use strict";
var model_api_1 = require("./model.api");
exports.MessageSeverity = model_api_1.MessageSeverity;
var model_registry_1 = require("./model.registry");
var model_base_1 = require("./model.base");
exports.ModelTypeConstrainable = model_base_1.ModelTypeConstrainable;
exports.ModelTypeItem = model_base_1.ModelTypeItem;
exports.ModelConstraints = model_base_1.ModelConstraints;
exports.ModelTypeConstraintOptional = model_base_1.ModelTypeConstraintOptional;
exports.ClientProps = model_base_1.ClientProps;
var model_number_1 = require("./model.number");
var model_string_1 = require("./model.string");
var model_bool_1 = require("./model.bool");
var model_infra_1 = require("./model.infra");
exports.ModelParseContext = model_infra_1.ModelParseContext;
exports.ObjectTraversal = model_infra_1.ObjectTraversal;
var model_registry_2 = require("./model.registry");
exports.ModelTypeRegistry = model_registry_2.ModelTypeRegistry;
var model_number_2 = require("./model.number");
exports.ModelTypeNumber = model_number_2.ModelTypeNumber;
exports.ModelTypeConstraintLess = model_number_2.ModelTypeConstraintLess;
exports.ModelTypeConstraintLessEqual = model_number_2.ModelTypeConstraintLessEqual;
exports.ModelTypeConstraintMore = model_number_2.ModelTypeConstraintMore;
exports.ModelTypeConstraintMoreEqual = model_number_2.ModelTypeConstraintMoreEqual;
exports.ModelTypeConstraintMultipleOf = model_number_2.ModelTypeConstraintMultipleOf;
var model_string_2 = require("./model.string");
exports.ModelTypeString = model_string_2.ModelTypeString;
exports.ModelTypeConstraintPossibleValues = model_string_2.ModelTypeConstraintPossibleValues;
exports.ModelTypeConstraintLength = model_string_2.ModelTypeConstraintLength;
exports.ModelTypeConstraintRegex = model_string_2.ModelTypeConstraintRegex;
var model_bool_2 = require("./model.bool");
exports.ModelTypeBool = model_bool_2.ModelTypeBool;
var model_array_1 = require("./model.array");
exports.ModelTypeArray = model_array_1.ModelTypeArray;
var model_object_1 = require("./model.object");
exports.ModelTypeObject = model_object_1.ModelTypeObject;
exports.ModelTypeConstraintConditionalValue = model_object_1.ModelTypeConstraintConditionalValue;
exports.ModelTypeConstraintCompareProperties = model_object_1.ModelTypeConstraintCompareProperties;
exports.ModelTypeConstraintEqualProperties = model_object_1.ModelTypeConstraintEqualProperties;
var model_schema_1 = require("./model.schema");
exports.ModelSchemaParser = model_schema_1.ModelSchemaParser;
var model_view_1 = require("./model.view");
exports.ValidationScope = model_view_1.ValidationScope;
exports.ModelView = model_view_1.ModelView;
var json_ref_1 = require("@hn3000/json-ref");
exports.JsonPointer = json_ref_1.JsonPointer;
exports.JsonReference = json_ref_1.JsonReference;
exports.JsonReferenceProcessor = json_ref_1.JsonReferenceProcessor;
var ModelTypeConstraints = (function () {
    function ModelTypeConstraints() {
    }
    ModelTypeConstraints.less = function (v) { return new model_number_1.ModelTypeConstraintLess(v); };
    ModelTypeConstraints.lessEqual = function (v) { return new model_number_1.ModelTypeConstraintLessEqual(v); };
    ModelTypeConstraints.more = function (v) { return new model_number_1.ModelTypeConstraintMore(v); };
    ModelTypeConstraints.moreEqual = function (v) { return new model_number_1.ModelTypeConstraintMoreEqual(v); };
    ModelTypeConstraints.multipleOf = function (v) { return new model_number_1.ModelTypeConstraintMultipleOf(v); };
    ModelTypeConstraints.possibleValues = function (v) { return new model_string_1.ModelTypeConstraintPossibleValues(v); };
    ModelTypeConstraints.recommendedValues = function (v) { return new model_string_1.ModelTypeConstraintPossibleValues(v).warnOnly(); };
    return ModelTypeConstraints;
}());
exports.ModelTypeConstraints = ModelTypeConstraints;
exports.modelTypes = new model_registry_1.ModelTypeRegistry();
exports.modelTypes.addType(new model_bool_1.ModelTypeBool());
exports.modelTypes.addType(new model_number_1.ModelTypeNumber());
exports.modelTypes.addType(exports.modelTypes.itemType('number').withConstraints(new model_number_1.ModelTypeConstraintInteger()));
exports.modelTypes.addType(new model_string_1.ModelTypeString());
exports.modelTypes.addArrayType(exports.modelTypes.type('number'));
exports.modelTypes.addArrayType(exports.modelTypes.type('number/int'));
exports.modelTypes.addArrayType(exports.modelTypes.type('string'));
exports.modelTypes.addArrayType(exports.modelTypes.type('boolean'));
//# sourceMappingURL=model.js.map