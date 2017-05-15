import * as React from 'react';
import { Component } from '@types/react';

const invariant = require('invariant'); // tslint:disable-line

import {
  visit,
  DocumentNode,
  DefinitionNode,
  VariableDefinitionNode,
  OperationDefinitionNode,
  NamedTypeNode,
  NonNullTypeNode,
  VariableNode,
  TypeNode,
  TypeDefinitionNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  GraphQLSchema,
} from 'graphql';

import { MutationOptions, QueryOptions } from 'react-apollo/lib/graphql';
import { Config, SubmissionError, FormSection } from 'redux-form';

import {
  FormDecorator,
  Form,
} from '@types/redux-form';

import { graphql } from 'react-apollo';
import { Field, reduxForm } from 'redux-form';

import { fromCamelToHuman } from './utils';

export type OperationTypeNode = 'query' | 'mutation';

export interface FormFieldResolver {
  [key: string]: any;
  component: string;
}

export interface FormFieldResolvers {
  [key: string]: FormFieldResolver;
}

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
  resolvers?: FormFieldResolvers;
  defs?: DocumentNode;
  renderField?: (component: typeof React.Component, props: FieldProps) => JSX.Element;
  renderForm?: (fields: any, props: FormProps) => JSX.Element;
};

interface VisitingContext {
  resolvers?: FormFieldResolvers;
  types: TypeDefinitions;
  renderField: (component: typeof React.Component, props: FieldProps) => JSX.Element;
}

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

const scalarTypeToField: any = {
  'String': { component: 'input', type: 'text' },
  'Int': { component: 'input', type: 'number' },
  'Float': { component: 'input', type: 'number' },
  'Boolean': { component: 'input', type: 'checkbox' },
  'ID': { component: 'input', type: 'hidden' },
};

const defaultRenderField = (Component: any, props: FieldProps) => {
  const { input, label, meta: { touched, error, warning }, ...rest } = props;
  return (
    <div>
      <label>{label}</label>
      <div>
        <Component {...input} placeholder={label} {...rest} />
        {touched && ((error && <span>{error}</span>) || (warning && <span>{warning}</span>))}
      </div>
    </div>
  );
};

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

function visitInputTypes(context: any, options: VisitingContext) {
  const { types, resolvers, renderField } = options;
  const { name, required } = context;
  return {
    EnumTypeDefinition(node: EnumTypeDefinitionNode) {
      const { values } = node;
      return (
        <Field key={name} name={name} label={fromCamelToHuman(name)} required={required}
             component={renderField.bind(undefined, 'select')} >
             {values.map( ({name: {value}}: EnumValueDefinitionNode) =>
                   <option key={value} value={value}>{value}</option> )}
        </Field>
      );
    },
    InputObjectTypeDefinition: {
      leave(node: InputObjectTypeDefinitionNode) {
        const { fields } = node;
        return (
          <FormSection name={name} key={name}>
            { fields }
          </FormSection>
        );
      },
    },
    InputValueDefinition(node: InputValueDefinitionNode) {
      const { name: { value }, type } = node;
      return visit(type, visitWithTypeInfo(options, { name: value }));
    },
  };
}

function visitWithTypeInfo(options: VisitingContext, context: any = {}) {
  const { types, resolvers } = options;
  return {
    VariableDefinition: {
      enter(node: VariableDefinitionNode) {
        const { variable: { name: {value} } } = node;
        context.name = value;
      },
      leave(node: VariableDefinitionNode) {
        delete context.name;
        return node.type;
      },
    },
    NamedType(node: NamedTypeNode) {
      const {
        name, required,
      } = context;
      const { renderField } = options;
      const { name: { value } } = node;

      if ( !!scalarTypeToField[value] ) {
        // XXX ugly
        const isHidden = value === 'ID';
        const { component, ...props} = scalarTypeToField[value];
        return (
          <Field key={name} name={name} label={fromCamelToHuman(name)} required={required && !isHidden}
                 component={renderField.bind(undefined, component)} {...props} />
        );
      } else if (resolvers && !!resolvers[ value ]) {
        const { component, ...props} =  resolvers[ value ];
        if (!!props) { // user defined type
          return (
            <Field key={name} name={name} label={fromCamelToHuman(name)} required={required}
                   component={renderField.bind(undefined, component)} {...props} />
          );
        }
      } else if (!!types[value]) {
        const typeDef = types[value];
        return visit(typeDef, visitInputTypes(context, options));
      } else {
        invariant( false,
          // tslint:disable-line
          `Field ${value} has an unknown type`,
        );
      }
    },
    NonNullType: {
      enter(node: NonNullTypeNode) {
        context[ 'required' ] = true;
      },
      leave(node: NonNullTypeNode) {
        delete context.required;
        return node.type;
      },
    },
  };
}

export function buildForm(
  document: DocumentNode,
  options: ApolloReduxFormOptions = {}): any {

  const {resolvers, defs, ...rest} = options;
  const { name, variables } = parseOperationSignature(document, 'mutation');
  const types = buildTypesTable(defs);
  const renderField = options.renderField || defaultRenderField;
  const fields = visit(variables, visitWithTypeInfo({types, resolvers, renderField}));
  const requiredFields =
    variables.filter( (variable) => variable.type.kind === 'NonNullType')
             .map( (variable) => variable.variable.name.value );
  const withForm = reduxForm({
    form: name,
    validate(values: any) {
      const errors: any = {};
      requiredFields.forEach( (fieldName: string) => {
        if ( !values[fieldName] ) {
          errors[ fieldName ] = 'Required field.';
        }
      });
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

export function apolloForm(
  document: DocumentNode,
  options: ApolloReduxFormOptions = {},
) {

  const withData = graphql(document, {
    props: ({ mutate }) => ({
      // variables contains right fields
      // because form is created from mutation variables
      handleSubmit: (variables: any) => mutate({
          variables,
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
