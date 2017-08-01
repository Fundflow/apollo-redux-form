"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var redux_form_1 = require("redux-form");
var utils_1 = require("./utils");
var defaultRenderField = function (Component, type) { return function (props) {
    var input = props.input, label = props.label, _a = props.meta, touched = _a.touched, error = _a.error, warning = _a.warning, rest = __rest(props, ["input", "label", "meta"]);
    return (React.createElement("div", null,
        React.createElement("label", null, label),
        React.createElement("div", null,
            React.createElement(Component, __assign({ type: type }, input, { placeholder: label }, rest)),
            touched && ((error && React.createElement("span", null, error)) || (warning && React.createElement("span", null, warning))))));
}; };
var defaultHiddenField = function (props) {
    var input = props.input, meta = props.meta, rest = __rest(props, ["input", "meta"]);
    return (React.createElement("input", __assign({ type: 'hidden' }, input, rest)));
};
var defaultRenderSelectField = function (props) {
    var input = props.input, label = props.label, options = props.options, _a = props.meta, touched = _a.touched, error = _a.error, warning = _a.warning, rest = __rest(props, ["input", "label", "options", "meta"]);
    return (React.createElement("div", null,
        React.createElement("label", null, label),
        React.createElement("div", null,
            React.createElement("select", __assign({}, input, rest), options.map(function (_a) {
                var key = _a.key, value = _a.value;
                return React.createElement("option", { key: key, value: value }, value);
            })),
            touched && ((error && React.createElement("span", null, error)) || (warning && React.createElement("span", null, warning))))));
};
var defaultFieldRenderers = {
    'String': defaultRenderField('input', 'text'),
    'Int': defaultRenderField('input', 'number'),
    'Float': defaultRenderField('input', 'number'),
    'Boolean': defaultRenderField('input', 'checkbox'),
    'ID': defaultHiddenField,
};
var FormBuilder = (function () {
    function FormBuilder() {
    }
    FormBuilder.prototype.createInputField = function (renderer, name, type, required) {
        var render = renderer.render, rest = __rest(renderer, ["render"]);
        var renderFn = render || defaultFieldRenderers[type];
        var hidden = type === 'ID';
        return (React.createElement(redux_form_1.Field, __assign({ key: name, name: name, label: utils_1.fromCamelToHuman(name), required: required && !hidden, component: renderFn }, rest)));
    };
    FormBuilder.prototype.createFormSection = function (name, children, required) {
        return (React.createElement(redux_form_1.FormSection, { name: name, key: name, required: required }, children));
    };
    FormBuilder.prototype.createSelectField = function (renderer, name, type, options, required) {
        var render = renderer.render, rest = __rest(renderer, ["render"]);
        var renderFn = render || defaultRenderSelectField;
        return (React.createElement(redux_form_1.Field, __assign({ key: name, name: name, label: utils_1.fromCamelToHuman(name), required: required, component: renderFn, options: options }, rest)));
    };
    FormBuilder.prototype.createArrayField = function (renderer, name, childType, required) {
        var render = renderer.render, rest = __rest(renderer, ["render"]);
        return (React.createElement(redux_form_1.FieldArray, __assign({ key: name, name: name, component: render, required: required }, rest)));
    };
    return FormBuilder;
}());
exports.FormBuilder = FormBuilder;
//# sourceMappingURL=render.js.map