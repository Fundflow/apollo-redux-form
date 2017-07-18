import * as React from 'react';

const _ = require('lodash'); // tslint:disable-line
const invariant = require('invariant'); // tslint:disable-line

import {
  visit,
  DocumentNode,
  DefinitionNode,
  VariableDefinitionNode,
  OperationDefinitionNode,
  NamedTypeNode,
  NonNullTypeNode,
  TypeDefinitionNode,
  EnumValueDefinitionNode,
  InputValueDefinitionNode,
} from 'graphql';

import { MutationOptions, QueryOptions } from 'react-apollo/lib/graphql';
import {
  reduxForm,
  Form,
  Config,
  SubmissionError,
} from 'redux-form';

import { graphql } from 'react-apollo';

import validate from './validation';
import {
  FormBuilder,
  FormFieldRenderer,
  FormFieldRenderers,
  FormFieldRenderFunction,
} from './render';

export type OperationTypeNode = 'query' | 'mutation';

export interface FormProps {
  handleSubmit: any;
  fields: any;
  pristine: boolean;
  submitting: boolean;
  invalid: boolean;
}

export interface FieldProps {
  input: any;
  label: string;
  meta: {
    touched: boolean;
    error: string;
    warning: string;
  };
  [prop: string]: any;
}

export type ApolloReduxFormOptions = Config<any, any, any> & MutationOptions & {
  renderers?: FormFieldRenderers;
  schema?: DocumentNode;
  renderForm?: (fields: any, props: FormProps) => JSX.Element;
};

interface TypeDefinitions {
  [type: string]: TypeDefinitionNode;
}

interface OperationSignature {
  name: string;
  operation: OperationTypeNode;
  variables: VariableDefinitionNode[];
}

function buildTypesTable(document?: DocumentNode): TypeDefinitions {
  const types: TypeDefinitions = {};

  if ( document ) {
    document.definitions.filter(
      (x: DefinitionNode) =>
        x.kind === 'EnumTypeDefinition' ||
        x.kind === 'InputObjectTypeDefinition' ||
        x.kind === 'ScalarTypeDefinition',
    ).forEach( (type: TypeDefinitionNode): void => { types[ type.name.value ] = type; });
  }

  return types;
}

function parseOperationSignature(document: DocumentNode, operation: OperationTypeNode ): OperationSignature {
  let variables, name;
  const definitions = document.definitions.filter(
    (x: DefinitionNode) => x.kind === 'OperationDefinition' && x.operation === operation,
  );
  invariant((definitions.length === 1),
    // tslint:disable-line
    `apollo-redux-form expects exactly one operation definition`,
  );
  const definition = definitions[0] as OperationDefinitionNode;
  variables = definition.variableDefinitions || [];
  let hasName = definition.name && definition.name.kind === 'Name';
  name = hasName && definition.name ? definition.name.value : 'data';
  return { name, variables, operation };
}

const defaultRenderForm = (fields: any, props: FormProps) => {
  const {
    handleSubmit,
    pristine,
    submitting,
    invalid,
  } = props;
  return (
    <form onSubmit={handleSubmit}>
      {fields}
      <div>
        <button type='submit' disabled={pristine || submitting || invalid}>
          Submit
        </button>
      </div>
    </form>
  );
};

export const isScalar = (name: string) =>
  ['ID', 'String', 'Int', 'Float', 'Boolean'].some( (x: string) => x === name );

function isRenderFunction(x: FormFieldRenderFunction | FormFieldRenderer): x is FormFieldRenderFunction {
  return x === undefined || (x as FormFieldRenderer).render === undefined;
}

class VisitingContext {
  private types: TypeDefinitions;
  private renderers: FormFieldRenderers;
  constructor(types: TypeDefinitions, renderers: FormFieldRenderers = {}) {
    this.types = types;
    this.renderers = renderers;
  }
  resolveType(typeName: string): TypeDefinitionNode | undefined {
    return this.types[typeName];
  }
  resolveRenderer(typeName: string): FormFieldRenderer {
    const render = this.renderers[typeName];
    return isRenderFunction(render) ? {render} : render;
  }
}

function visitWithContext(context: VisitingContext, forceRequired: boolean = false) {
  const builder: FormBuilder = new FormBuilder();
  const path: string[] = [];
  let required: boolean = forceRequired;
  return {
    VariableDefinition: {
      enter(node: VariableDefinitionNode) {
        const { variable: { name: {value} } } = node;
        path.push(value);
      },
      leave(node: VariableDefinitionNode) {
        path.pop();
        return node.type;
      },
    },
    NamedType(node: NamedTypeNode) {
      const { name: { value: typeName } } = node;
      const fullPath = path.join('.');
      const type = context.resolveType(typeName);
      const renderer = context.resolveRenderer(typeName);

      if ( isScalar(typeName) ) {
        return builder.createInputField(renderer, fullPath, typeName, required);
      } else {
        if (type) {
          switch ( type.kind ) {
            case 'InputObjectTypeDefinition':
              const children = visit(type.fields, visitWithContext(context, required));
              return builder.createFormSection(fullPath, children);
            case 'EnumTypeDefinition':
              const options = type.values.map(
                ({name: {value}}: EnumValueDefinitionNode) => ({key: value, value}),
              );
              return builder.createSelectField(renderer, fullPath, typeName, options, required);
            case 'ScalarTypeDefinition':
              if (renderer.render !== undefined) {
                return builder.createInputField(renderer, fullPath, typeName, required);
              } else {
                invariant( false,
                  // tslint:disable-line
                  `Type ${typeName} does not have a default renderer, see ${fullPath}`,
                );
              }
              break;
            default:
              invariant( false,
                // tslint:disable-line
                `Type ${type.kind} is not handled yet, see ${fullPath}`,
              );
          }
        } else {
          invariant( false,
            // tslint:disable-line
            `Type ${typeName} is unknown for property ${fullPath}`,
          );
        }
      }

      return;
    },
    NonNullType: {
      enter(node: NonNullTypeNode) {
        required = true;
      },
      leave(node: NonNullTypeNode) {
        required = forceRequired;
        return node.type;
      },
    },
    InputValueDefinition: {
      enter(node: InputValueDefinitionNode) {
        const { name: { value }, type } = node;
        path.push(value);
      },
      leave(node: InputValueDefinitionNode) {
        path.pop();
        return node.type;
      },
    },
  };
}

export function buildForm(
  document: DocumentNode,
  options: ApolloReduxFormOptions = {}): any {

  const {renderers, schema, ...rest} = options;
  const { name, variables } = parseOperationSignature(document, 'mutation');
  const types = buildTypesTable(schema);

  const context = new VisitingContext(types, renderers);
  const fields = visit(variables, visitWithContext(context));

  const withForm = reduxForm({
    form: name,
    validate: validate.bind(undefined, fields),
    ...rest,
  });
  const renderFn = options.renderForm || defaultRenderForm;
  return withForm(renderFn.bind(undefined, fields));
}

export type InitFormOptions = (Object | ((props: any) => QueryOptions )) & {
  mapToForm?: (values: any) => any;
  [key: string]: any;
};

export const initForm = (document: DocumentNode, options: InitFormOptions): any => graphql(document, {
  options,
  props: ({ data }) => {
    const {loading, error} = data;
    const { name } = parseOperationSignature(document, 'query');
    const result = data[name];
    const initialValues =
      options.mapToForm && result ? options.mapToForm(result) : result;
    return {
      loading,
      initialValues,
    };
  },
});

export function apolloForm(
  document: DocumentNode,
  options: ApolloReduxFormOptions = {},
) {

  const removeNotRegistredField = (variables: any, registeredFields: any, path: string[] = []) => {
    const result: any = {};
    for (let key in variables) {
      const value = variables[key];
      path.push(key);
      if (_.isObject(value)) {
        const pruned = removeNotRegistredField(value, registeredFields, path);
        if (!_.isEmpty(pruned)) {
          result[key] = pruned;
        }
      } else {
        if (registeredFields[path.join('.')]) {
          result[key] = variables[key];
        }
      }
      path.pop();
    }
    return result;
  };

  const withData = graphql(document, {
    props: ({ mutate }) => ({
      // Since react-redux 6 forms can be initialized with arbitrary values.
      // On submit all values are sent and not only those matching registeredFields.
      // In general it is a problem with Apollo mutations because they expect only registred fields.
      // Hence, we need to prune spurious values.
      // see https://github.com/erikras/redux-form/issues/1453
      handleSubmit: (variables: any, dispatch: void, props: any) => mutate({
          variables: removeNotRegistredField(variables, props.registeredFields),
          ... options,
        }).catch ( (error: any) => { throw new SubmissionError(error); } ),
    }),
  });

  const Form = buildForm(document, options) as any;

  return withData( (props: any) => {
    const { handleSubmit, ...rest } = props;
    return (
      <Form onSubmit={handleSubmit} {...rest}/>
    );
  });
}
