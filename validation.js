"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('lodash');
function validateImpl(fields, values, isParentRequired) {
    if (values === void 0) { values = {}; }
    if (isParentRequired === void 0) { isParentRequired = false; }
    var errors = Object.create(null);
    fields.forEach(function (field) {
        var fieldName = field.props.name;
        var children = field.props.children;
        var isRequired = field.props.required;
        var value = values[fieldName];
        if (children && children.length > 0) {
            var next = _.isObject(value) ? value : Object.create(null);
            var result = validateImpl(children, next, isRequired);
            if (!_.isEmpty(result)) {
                errors[fieldName] = result;
            }
        }
        else if (isRequired || isParentRequired) {
            if (!value) {
                errors[fieldName] = 'Required field.';
            }
        }
    });
    return errors;
}
function validate(fields, values) {
    if (values === void 0) { values = {}; }
    return validateImpl(fields, values);
}
exports.default = validate;
//# sourceMappingURL=validation.js.map