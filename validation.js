"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function validate(fields, values) {
    if (values === void 0) { values = {}; }
    var errors = {};
    fields.forEach(function (field) {
        var fieldName = field.props.name;
        var value = values[fieldName];
        if (field.props.required) {
            if (!value) {
                errors[fieldName] = 'Required field.';
            }
        }
    });
    return errors;
}
exports.default = validate;
//# sourceMappingURL=validation.js.map