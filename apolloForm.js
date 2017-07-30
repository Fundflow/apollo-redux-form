"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var _ = require('lodash');
var invariant = require('invariant');
var deepmerge = require("deepmerge");
var graphql_1 = require("graphql");
var redux_form_1 = require("redux-form");
var react_apollo_1 = require("react-apollo");
var validation_1 = require("./validation");
var render_1 = require("./render");
function buildTypesTable(document) {
    var types = {};
    if (document) {
        document.definitions.filter(function (x) {
            return x.kind === 'EnumTypeDefinition' ||
                x.kind === 'InputObjectTypeDefinition' ||
                x.kind === 'ScalarTypeDefinition';
        }).forEach(function (type) { types[type.name.value] = type; });
    }
    return types;
}
function parseOperationSignature(document, operation) {
    var variables, name;
    var definitions = document.definitions.filter(function (x) { return x.kind === 'OperationDefinition' && x.operation === operation; });
    invariant((definitions.length === 1), "apollo-redux-form expects exactly one operation definition");
    var definition = definitions[0];
    variables = definition.variableDefinitions || [];
    var hasName = definition.name && definition.name.kind === 'Name';
    name = hasName && definition.name ? definition.name.value : 'data';
    return { name: name, variables: variables, operation: operation };
}
var defaultRenderForm = function (fields, props) {
    var handleSubmit = props.handleSubmit, pristine = props.pristine, submitting = props.submitting, invalid = props.invalid;
    return (React.createElement("form", { onSubmit: handleSubmit },
        fields,
        React.createElement("div", null,
            React.createElement("button", { type: 'submit', disabled: pristine || submitting || invalid }, "Submit"))));
};
exports.isScalar = function (name) {
    return ['ID', 'String', 'Int', 'Float', 'Boolean'].some(function (x) { return x === name; });
};
function isRenderFunction(x) {
    return x === undefined || x.render === undefined;
}
var VisitingContext = (function () {
    function VisitingContext(types, renderers, customFields) {
        if (renderers === void 0) { renderers = {}; }
        if (customFields === void 0) { customFields = {}; }
        this.types = types;
        this.renderers = renderers;
        this.customFields = customFields;
    }
    VisitingContext.prototype.resolveType = function (typeName) {
        return this.types[typeName];
    };
    VisitingContext.prototype.resolveRenderer = function (typeName) {
        var render = this.renderers[typeName];
        return isRenderFunction(render) ? { render: render } : render;
    };
    VisitingContext.prototype.resolveFieldRenderer = function (fieldPath) {
        var render = this.customFields[fieldPath];
        return isRenderFunction(render) ? { render: render } : render;
    };
    return VisitingContext;
}());
function visitWithContext(context, path) {
    if (path === void 0) { path = []; }
    var builder = new render_1.FormBuilder();
    var fieldName = '';
    var required = false;
    return {
        VariableDefinition: {
            enter: function (node) {
                var value = node.variable.name.value;
                fieldName = value;
            },
            leave: function (node) {
                fieldName = '';
                return node.type;
            },
        },
        NamedType: function (node) {
            var typeName = node.name.value;
            var fullPath = path.concat(fieldName);
            var fullPathStr = fullPath.join('.');
            var type = context.resolveType(typeName);
            var renderer = context.resolveRenderer(typeName);
            var customFieldRenderer = context.resolveFieldRenderer(fullPathStr);
            if (customFieldRenderer.render !== undefined) {
                return builder.createInputField(customFieldRenderer, fieldName, typeName, required);
            }
            else if (exports.isScalar(typeName)) {
                return builder.createInputField(renderer, fieldName, typeName, required);
            }
            else {
                if (type) {
                    switch (type.kind) {
                        case 'InputObjectTypeDefinition':
                            var children = graphql_1.visit(type.fields, visitWithContext(context, fullPath));
                            return builder.createFormSection(fieldName, children, required);
                        case 'EnumTypeDefinition':
                            var options = type.values.map(function (_a) {
                                var value = _a.name.value;
                                return ({ key: value, value: value });
                            });
                            return builder.createSelectField(renderer, fieldName, typeName, options, required);
                        case 'ScalarTypeDefinition':
                            if (renderer.render !== undefined) {
                                return builder.createInputField(renderer, fieldName, typeName, required);
                            }
                            else {
                                invariant(false, "Type " + typeName + " does not have a default renderer, see " + fullPathStr);
                            }
                            break;
                        default:
                            invariant(false, "Type " + type.kind + " is not handled yet, see " + fullPathStr);
                    }
                }
                else {
                    invariant(false, "Type " + typeName + " is unknown for property " + fullPathStr);
                }
            }
            return;
        },
        NonNullType: {
            enter: function (node) {
                required = true;
            },
            leave: function (node) {
                required = false;
                return node.type;
            },
        },
        InputValueDefinition: {
            enter: function (node) {
                var value = node.name.value, type = node.type;
                fieldName = value;
            },
            leave: function (node) {
                fieldName = '';
                return node.type;
            },
        },
    };
}
function buildForm(document, options) {
    if (options === void 0) { options = {}; }
    var renderers = options.renderers, customFields = options.customFields, schema = options.schema, validate = options.validate, rest = __rest(options, ["renderers", "customFields", "schema", "validate"]);
    var _a = parseOperationSignature(document, 'mutation'), name = _a.name, variables = _a.variables;
    var types = buildTypesTable(schema);
    var context = new VisitingContext(types, renderers, customFields);
    var fields = graphql_1.visit(variables, visitWithContext(context));
    var withForm = redux_form_1.reduxForm(__assign({ form: name, validate: function (values, props) {
            var errors = validation_1.default(fields, values);
            if (validate) {
                errors = deepmerge(errors, validate(values, props));
            }
            return errors;
        } }, rest));
    var renderFn = options.renderForm || defaultRenderForm;
    return withForm(renderFn.bind(undefined, fields));
}
exports.buildForm = buildForm;
exports.initForm = function (document, options) { return react_apollo_1.graphql(document, {
    options: options,
    props: function (_a) {
        var data = _a.data;
        var loading = data.loading, error = data.error;
        var name = parseOperationSignature(document, 'query').name;
        var result = data[name];
        var initialValues = options.mapToForm && result ? options.mapToForm(result) : result;
        return {
            loading: loading,
            initialValues: initialValues,
        };
    },
}); };
function apolloForm(document, options) {
    if (options === void 0) { options = {}; }
    var removeNotRegistredField = function (variables, registeredFields, path) {
        if (path === void 0) { path = []; }
        var result = {};
        for (var key in variables) {
            var value = variables[key];
            path.push(key);
            if (_.isObject(value)) {
                var pruned = removeNotRegistredField(value, registeredFields, path);
                if (!_.isEmpty(pruned)) {
                    result[key] = pruned;
                }
            }
            else {
                if (registeredFields[path.join('.')]) {
                    result[key] = variables[key];
                }
            }
            path.pop();
        }
        return result;
    };
    var withData = react_apollo_1.graphql(document, {
        withRef: true,
        props: function (_a) {
            var mutate = _a.mutate;
            return ({
                handleSubmit: function (variables, dispatch, props) { return mutate(__assign({ variables: removeNotRegistredField(variables, props.registeredFields) }, options)).then(function (response) {
                    var name = parseOperationSignature(document, 'mutation').name;
                    return response.data[name];
                }).catch(function (error) { throw new redux_form_1.SubmissionError(error); }); },
            });
        },
    });
    var GraphQLForm = buildForm(document, options);
    var ApolloFormWrapper = (function (_super) {
        __extends(ApolloFormWrapper, _super);
        function ApolloFormWrapper() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.form = null;
            _this.getFormInstance = function () {
                return _this.form;
            };
            return _this;
        }
        ApolloFormWrapper.prototype.render = function () {
            var _this = this;
            var _a = this.props, handleSubmit = _a.handleSubmit, rest = __rest(_a, ["handleSubmit"]);
            return (React.createElement(GraphQLForm, __assign({ ref: function (c) { _this.form = c; }, onSubmit: handleSubmit }, rest)));
        };
        return ApolloFormWrapper;
    }(React.Component));
    var wrapper = withData(ApolloFormWrapper);
    return wrapper;
}
exports.apolloForm = apolloForm;
//# sourceMappingURL=apolloForm.js.map