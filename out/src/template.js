"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var itemRE = /((?:.|\r|\n)*?)\{{(.*?)}}/gm;
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
var Template = (function () {
    function Template(templateString, defaults) {
        var parts = [];
        var end = 0;
        var m = null;
        while (null != (m = itemRE.exec(templateString))) {
            if (m[1]) {
                parts.push(echoValue.bind(null, m[1]));
            }
            parts.push(selectValue.bind(null, m[2]));
            end = itemRE.lastIndex;
        }
        if (end < templateString.length) {
            parts.push(echoValue.bind(null, templateString.substring(end)));
        }
        this._parts = parts;
        this._defaults = defaults || {};
    }
    Template.prototype.render = function (values) {
        var defaults = this._defaults;
        var str = this._parts.map(function (x) { return x(values, defaults); });
        return str.join('');
    };
    Template.prototype.setDefaults = function (defaultValues) {
        this._defaults = defaultValues;
    };
    return Template;
}());
exports.Template = Template;
//# sourceMappingURL=template.js.map