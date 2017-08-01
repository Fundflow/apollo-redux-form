import * as React from 'react';

const _ = require('lodash'); // tslint:disable-line
const invariant = require('invariant'); // tslint:disable-line

import * as deepmerge from 'deepmerge';

import {
  BREAK,
  visit,
  DocumentNode,
  DefinitionNode,
  VariableDefinitionNode,
  OperationDefinitionNode,
  NamedTypeNode,
  NonNullTypeNode,
  ListTypeNode,
  TypeDefinitionNode,
  EnumValueDefinitionNode,
  InputValueDefinitionNode,
} from 'graphql';

import { MutationOptions, QueryOptions } from 'react-apollo/lib/graphql';
import {
  reduxForm,
  Config,
  SubmissionError,
} from 'redux-form';

import { graphql } from 'react-apollo';

import validateRequiredFields from './validation';
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

export interface Fields {
  length: number;
  forEach(callback: (name: string, index: number, fields: Fields) => void): void;
  get(index: number): any;
  getAll(): any[];
  insert(index: number, value: any): void;
  map(callback: (name: string, index: number, fields: Fields) => any): any;
  pop(): any;
  push(value: any): void;
  remove(index: number): void;
  shift(): any;
  swap(indexA: number, indexB: number): void;
  unshift(value: any): void;
}

export interface ArrayFieldProps {
  fields: Fields;
  meta: {
    touched: boolean;
    error: string;
    warning: string;
  };
  [prop: string]: any;
}

export type ApolloReduxFormOptions = Config<any, any, any> & MutationOptions & {
  customFields?: FormFieldRenderers;
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
    (x: OperationDefinitionNode) => x.kind === 'OperationDefinition' && x.operation === operation,
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
  private customFields: FormFieldRenderers;
  constructor(types: TypeDefinitions, renderers: FormFieldRenderers = {}, customFields = {}) {
    this.types = types;
    this.renderers = renderers;
    this.customFields = customFields;
  }
  resolveType(typeName: string): TypeDefinitionNode | undefined {
    return this.types[typeName];
  }
  resolveRenderer(typeName: string): FormFieldRenderer {
    const render = this.renderers[typeName];
    return isRenderFunction(render) ? {render} : render;
  }
  resolveFieldRenderer(fieldPath: string): FormFieldRenderer {
    const render = this.customFields[fieldPath];
    return isRenderFunction(render) ? {render} : render;
  }
}

function visitWithContext(context: VisitingContext, path: string[] = []) {
  const builder: FormBuilder = new FormBuilder();
  let fieldName: string = '';
  // XXX maybe I do not need this var, I can handle the login inside NonNull hook
  let required: boolean = false;
  return {
    VariableDefinition: {
      enter(node: VariableDefinitionNode) {
        const { variable: { name: {value} } } = node;
        fieldName = value;
      },
      leave(node: VariableDefinitionNode) {
        fieldName = '';
        return node.type;
      },
    },
    NamedType(node: NamedTypeNode) {
      const { name: { value: typeName } } = node;

      const fullPath = path.concat(fieldName);
      const fullPathStr = fullPath.join('.');

      const type = context.resolveType(typeName);
      const renderer = context.resolveRenderer(typeName);
      const customFieldRenderer = context.resolveFieldRenderer(fullPathStr);

      if (customFieldRenderer.render !== undefined ) {
        // if a render for this path exists, take the highest priority
        return builder.createInputField(customFieldRenderer, fieldName, typeName, required);
      } else if ( isScalar(typeName) ) {
        return builder.createInputField(renderer, fieldName, typeName, required);
      } else {
        if (type) {
          switch ( type.kind ) {
            case 'InputObjectTypeDefinition':
              const children = visit(type.fields, visitWithContext(context, fullPath));
              return builder.createFormSection(fieldName, children, required);
            case 'EnumTypeDefinition':
              const options = type.values.map(
                ({name: {value}}: EnumValueDefinitionNode) => ({key: value, value}),
              );
              return builder.createSelectField(renderer, fieldName, typeName, options, required);
            case 'ScalarTypeDefinition':
              if (renderer.render !== undefined) {
                return builder.createInputField(renderer, fieldName, typeName, required);
              } else {
                invariant( false,
                  // tslint:disable-line
                  `Type ${typeName} does not have a default renderer, see ${fullPathStr}`,
                );
              }
              break;
            default:
              invariant( false,
                // tslint:disable-line
                `Type ${type.kind} is not handled yet, see ${fullPathStr}`,
              );
          }
        } else {
          invariant( false,
            // tslint:disable-line
            `Type ${typeName} is unknown for property ${fullPathStr}`,
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
        required = false;
        return node.type;
      },
    },
    ListType(node: ListTypeNode) {
      const fullPath = path.concat(fieldName);
      const fullPathStr = fullPath.join('.');
      const customFieldRenderer = context.resolveFieldRenderer(fullPathStr);

      // XXX we should also consider NotNullType
      const {
        name: {
          value: typeName,
        },
      } = node.type as NamedTypeNode;

      // XXX we are assuming that type is not a scalar
      const type = context.resolveType(typeName);

      if (type) {
        if (customFieldRenderer.render) {
          return builder.createArrayField(customFieldRenderer, fieldName, type, required);
        } else {
          invariant( false,
            // tslint:disable-line
            `List Type requires a custom field renderer. No renderer found for ${fullPathStr}`,
          );
        }
      } else {
        invariant( false,
          // tslint:disable-line
          `Cannot resolve type ${typeName}`,
        );
      }

      return BREAK;

    },
    InputValueDefinition: {
      enter(node: InputValueDefinitionNode) {
        const { name: { value }, type } = node;
        fieldName = value;
      },
      leave(node: InputValueDefinitionNode) {
        fieldName = '';
        return node.type;
      },
    },
  };
}

export function buildForm(
  document: DocumentNode,
  options: ApolloReduxFormOptions = {}): any {

  const {renderers, customFields, schema, validate, ...rest} = options;
  const { name, variables } = parseOperationSignature(document, 'mutation');
  const types = buildTypesTable(schema);

  const context = new VisitingContext(types, renderers, customFields);
  const fields = visit(variables, visitWithContext(context));

  const withForm = reduxForm({
    form: name,
    validate(values, props) {
      let errors = validateRequiredFields(fields, values);
      if (validate) {
        errors = deepmerge(errors, validate(values, props));
      }
      return errors;
    },
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

interface ApolloFormWrapperProps {
  handleSubmit: () => void;
}

interface MutationResponse {
  data: {
    [key: string]: any;
  };
}

export function apolloForm(
  document: DocumentNode,
  options: ApolloReduxFormOptions = {},
): React.ComponentClass<any> {

  const removeNotRegistredField = (variables: any, registeredFields: any, path: string[] = []) => {
    const result: any = {};
    for (let key in variables) {
      const value = variables[key];
      path.push(key);
      // redux-form handles array values as scalars
      // fields of objects in array are not registred
      // this could be a major problem using Apollo, but for now it works for our simple use cases
      if (_.isObject(value) && !_.isArray(value)) {
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
    withRef: true,
    props: ({ mutate }) => ({
      // Since react-redux 6 forms can be initialized with arbitrary values.
      // On submit all values are sent and not only those matching registeredFields.
      // In general it is a problem with Apollo mutations because they expect only registred fields.
      // Hence, we need to prune spurious values.
      // see https://github.com/erikras/redux-form/issues/1453
      handleSubmit: (variables: any, dispatch: void, props: any) => mutate({
        variables: removeNotRegistredField(variables, props.registeredFields),
        ... options,
      }).then( (response: MutationResponse) => {
        const { name } = parseOperationSignature(document, 'mutation');
        return response.data[name];
      }).catch( (error: any) => { throw new SubmissionError(error); } ),
    }),
  });

  const GraphQLForm = buildForm(document, options) as any;

  class ApolloFormWrapper extends React.Component<ApolloFormWrapperProps, void> {
    form = null;
    public getFormInstance = () =>  {
      return this.form;
    }
    render() {
      const { handleSubmit, ...rest } = this.props;
      return (
        <GraphQLForm
          ref={ (c: any) => { this.form = c; }}
          onSubmit={handleSubmit}
          {...rest}
        />
      );
    }
  }

  const wrapper: React.ComponentClass<any> = withData(ApolloFormWrapper);

  return wrapper;
}
