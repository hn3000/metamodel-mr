"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var defaultPattern = makePattern('{{X}}');
function echoValue(k, a, b) {
    return k;
}
function selectValue(k, a, b) {
    var av = a[k];
    if (null != av)
        return av;
    var av = b[k];
    if (null != av)
        return av;
    return '{{' + k + '}}';
}
var TemplateFactory = (function () {
    function TemplateFactory(config) {
        this._config = config;
    }
    TemplateFactory.prototype.parse = function (template, defaults) {
        if (defaults === void 0) { defaults = this._config.defaults; }
        return new Template(template, defaults, __assign({}, this._config));
    };
    return TemplateFactory;
}());
exports.TemplateFactory = TemplateFactory;
var Template = (function () {
    function Template(templateString, defaults, config) {
        this._config = { pattern: defaultPattern, defaults: {} };
        if (null != config) {
            var pattern_1 = makePattern(config.pattern);
            this._config = __assign({}, this._config, config, { pattern: pattern_1 });
        }
        if (null != defaults) {
            this._config = __assign({}, this._config, { defaults: defaults });
        }
        var parts = [];
        var end = 0;
        var m = null;
        var pattern = this._config.pattern;
        while (null != (m = pattern.exec(templateString))) {
            if (m[1]) {
                parts.push(echoValue.bind(null, m[1]));
            }
            parts.push(selectValue.bind(null, m[2]));
            end = pattern.lastIndex;
        }
        if (end < templateString.length) {
            parts.push(echoValue.bind(null, templateString.substring(end)));
        }
        this._parts = parts;
    }
    Template.prototype.render = function (values) {
        var defaults = this._config.defaults;
        var str = this._parts.map(function (x) { return x(values, defaults); });
        return str.join('');
    };
    Template.prototype.setDefaults = function (defaults) {
        this._config = __assign({}, this._config, { defaults: defaults });
    };
    return Template;
}());
exports.Template = Template;
function Q(x) {
    return x.replace(/[\^\$\[\]]/gm, function (f) { return '\\' + f; });
}
function makePattern(pattern, splitPoint) {
    if (splitPoint === void 0) { splitPoint = 'X'; }
    if ('string' === typeof pattern) {
        var patternParts = pattern.split(splitPoint);
        var reTEXT = [
            '((?:.|\r|\n)*?)', Q(patternParts[0]), '(.*?)', Q(patternParts[1])
        ].join('');
        return new RegExp(reTEXT, 'gm');
    }
    return pattern;
}
exports.makePattern = makePattern;
//# sourceMappingURL=template.js.map