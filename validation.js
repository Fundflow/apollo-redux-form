"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('lodash');
function validateImpl(fields, values) {
    if (values === void 0) { values = {}; }
    var errors = Object.create(null);
    fields.forEach(function (field) {
        var fieldName = field.props.name;
        var children = field.props.children;
        var isRequired = field.props.required;
        var value = values[fieldName];
        if (isRequired && ((_.isEmpty(value) && !_.isObject(value)) || _.isNil(value))) {
            errors[fieldName] = 'Required field.';
        }
        else {
            if (children && children.length > 0) {
                var result = validateImpl(children, value);
                if (!_.isEmpty(result)) {
                    errors[fieldName] = result;
                }
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