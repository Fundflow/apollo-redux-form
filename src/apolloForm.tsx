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
  GraphQLSchema,
} from 'graphql';

import { MutationOptions, QueryOptions } from 'react-apollo/lib/graphql';
import { Config } from 'redux-form';

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

export type ApolloReduxFormOptions = Config<any, any, any> & MutationOptions & {
  resolvers?: FormFieldResolvers;
  defs?: DocumentNode;
};

interface VisitingContext {
  resolvers?: FormFieldResolvers;
  types: TypeDefinitions;
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

const renderField = (Component: any, { input, label, inner, meta: { touched, error, warning }, ...props }: any) => (
  <div>
    <label>{label}</label>
    <div>
      <Component {...input} placeholder={label} {...props}>
        {inner}
      </Component>
      {touched && ((error && <span>{error}</span>) || (warning && <span>{warning}</span>))}
    </div>
  </div>
);

function buildFieldsVisitor(options: VisitingContext): any {
  return {
    VariableDefinition(node: VariableDefinitionNode) {
      const { variable: { name: {value} }, type } = node;
      const { component, ...props } = visit(type, buildFieldsVisitor(options), {});
      return (
        <Field key={value} name={value} label={fromCamelToHuman(value)}
               component={renderField.bind(undefined, component)} {...props} />
      );
    },
    NamedType(node: NamedTypeNode) {
      const { types, resolvers } = options;
      const { name: { value } } = node;
      let props;

      props = scalarTypeToField[value];
      if (!!props) {
        return props;
      }

      const typeDef = types[value];
      invariant( !!typeDef,
        // tslint:disable-line
        `user defined field ${value} does not correspond to any known graphql types`,
      );
      props = resolvers && resolvers[ value ];
      if (!!props) { // user defined type
        return props;
      } else if ( typeDef.kind === 'EnumTypeDefinition' ) {
        const inner = (typeDef as EnumTypeDefinitionNode).values.map( ({name}: EnumValueDefinitionNode) =>
              <option key={name.value} value={name.value}>{name.value}</option> );
        return { component: 'select', inner };
      }

      invariant( false,
        // tslint:disable-line
        `not able to find a definition for type ${value}`,
      );
    },
    NonNullType(node: NonNullTypeNode) {
      const { type } = node;
      const props = visit(type, buildFieldsVisitor(options), {});
      return { required: true, ...props };
    },
  };
}

export function buildForm(
  document: DocumentNode,
  {initialValues, resolvers, defs}: ApolloReduxFormOptions = {}): any {

  const { name, variables } = parseOperationSignature(document, 'mutation');
  const types = buildTypesTable(defs);
  const fields = visit(variables, buildFieldsVisitor({types, resolvers}), {});
  const requiredFields =
    variables.filter( (variable) => variable.type.kind === 'NonNullType')
             .map( (variable) => variable.variable.name.value );
  const withForm = reduxForm({
    form: name,
    initialValues,
    validate(values: any) {
      const errors: any = {};
      requiredFields.forEach( (fieldName: string) => {
        if ( !values[fieldName] ) {
          errors[ fieldName ] = 'Required field.';
        }
      });
      return errors;
    },
  });
  return withForm( class FormComponent extends React.Component<any, any> {
    render() {
      const { handleSubmit, pristine, submitting, invalid, styles } = this.props;
      return (
        <form onSubmit={handleSubmit} className={styles && styles.form}>
          {fields}
          <div>
            <button type='submit' disabled={pristine || submitting || invalid}>
              Submit
            </button>
          </div>
        </form>
      );
    }
  });
}

export type InitFormOptions = Object | ((props: any) => QueryOptions );

export const initForm = (document: DocumentNode, options: InitFormOptions): any => graphql(document, {
  options,
  props: ({ data }) => {
    const {loading, error} = data;
    const { name } = parseOperationSignature(document, 'query');
    const initialValues = data[name];
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

  const { onSubmit } = options;

  const withData = graphql(document, {
    props: ({ mutate }) => ({
      // variables contains right fields
      // because form is created from mutation variables
      handleSubmit: (variables: any) => {
        mutate({
          variables,
          ... options,
        }).then(onSubmit).catch(console.log);
      },
    }),
  });

  // XXX add onSubmit to Form
  const Form = buildForm(document, options) as any;

  return withData( (props: any) => {
    const { handleSubmit, ...rest } = props;
    return (
      <Form onSubmit={handleSubmit} {...rest}/>
    );
  });
}
