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
var _ = require('lodash');
var invariant = require('invariant');
var graphql_1 = require("graphql");
var redux_form_1 = require("redux-form");
var react_apollo_1 = require("react-apollo");
var redux_form_2 = require("redux-form");
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
    function VisitingContext(types, renderers) {
        if (renderers === void 0) { renderers = {}; }
        this.types = types;
        this.renderers = renderers;
    }
    VisitingContext.prototype.resolveType = function (typeName) {
        return this.types[typeName];
    };
    VisitingContext.prototype.resolveRenderer = function (typeName) {
        var render = this.renderers[typeName];
        return isRenderFunction(render) ? { render: render } : render;
    };
    return VisitingContext;
}());
function visitWithContext(context, forceRequired) {
    if (forceRequired === void 0) { forceRequired = false; }
    var builder = new render_1.FormBuilder();
    var path = [];
    var required = forceRequired;
    return {
        VariableDefinition: {
            enter: function (node) {
                var value = node.variable.name.value;
                path.push(value);
            },
            leave: function (node) {
                path.pop();
                return node.type;
            },
        },
        NamedType: function (node) {
            var typeName = node.name.value;
            var fullPath = path.join('.');
            var type = context.resolveType(typeName);
            var renderer = context.resolveRenderer(typeName);
            if (exports.isScalar(typeName)) {
                return builder.createInputField(renderer, fullPath, typeName, required);
            }
            else {
                if (type) {
                    switch (type.kind) {
                        case 'InputObjectTypeDefinition':
                            var children = graphql_1.visit(type.fields, visitWithContext(context, required));
                            return builder.createFormSection(fullPath, children);
                        case 'EnumTypeDefinition':
                            var options = type.values.map(function (_a) {
                                var value = _a.name.value;
                                return ({ key: value, value: value });
                            });
                            return builder.createSelectField(renderer, fullPath, typeName, options, required);
                        case 'ScalarTypeDefinition':
                            if (renderer.render !== undefined) {
                                return builder.createInputField(renderer, fullPath, typeName, required);
                            }
                            else {
                                invariant(false, "Type " + typeName + " does not have a default renderer, see " + fullPath);
                            }
                            break;
                        default:
                            invariant(false, "Type " + type.kind + " is not handled yet, see " + fullPath);
                    }
                }
                else {
                    invariant(false, "Type " + typeName + " is unknown for property " + fullPath);
                }
            }
            return;
        },
        NonNullType: {
            enter: function (node) {
                required = true;
            },
            leave: function (node) {
                required = forceRequired;
                return node.type;
            },
        },
        InputValueDefinition: {
            enter: function (node) {
                var value = node.name.value, type = node.type;
                path.push(value);
            },
            leave: function (node) {
                path.pop();
                return node.type;
            },
        },
    };
}
function buildForm(document, options) {
    if (options === void 0) { options = {}; }
    var renderers = options.renderers, schema = options.schema, rest = __rest(options, ["renderers", "schema"]);
    var _a = parseOperationSignature(document, 'mutation'), name = _a.name, variables = _a.variables;
    var types = buildTypesTable(schema);
    var context = new VisitingContext(types, renderers);
    var fields = graphql_1.visit(variables, visitWithContext(context));
    var withForm = redux_form_2.reduxForm(__assign({ form: name, validate: validation_1.default.bind(undefined, fields) }, rest));
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
        props: function (_a) {
            var mutate = _a.mutate;
            return ({
                handleSubmit: function (variables, dispatch, props) { return mutate(__assign({ variables: removeNotRegistredField(variables, props.registeredFields) }, options)).catch(function (error) { throw new redux_form_1.SubmissionError(error); }); },
            });
        },
    });
    var Form = buildForm(document, options);
    return withData(function (props) {
        var handleSubmit = props.handleSubmit, rest = __rest(props, ["handleSubmit"]);
        return (React.createElement(Form, __assign({ onSubmit: handleSubmit }, rest)));
    });
}
exports.apolloForm = apolloForm;
//# sourceMappingURL=apolloForm.js.map