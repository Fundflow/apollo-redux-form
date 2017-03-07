import * as React from 'react';
import {Component } from '@types/react';

const invariant = require('invariant');

import {
  DocumentNode,
  DefinitionNode,
  VariableDefinitionNode,
  OperationDefinitionNode,
  NamedTypeNode,
  VariableNode,
  TypeNode,
} from 'graphql';

import {
  FormDecorator,
  Form,
} from '@types/redux-form';

import { graphql } from 'react-apollo'
import { Field, reduxForm } from 'redux-form'

interface IMutationDefinition {
  name: string;
  variables: VariableDefinitionNode[];
}

function parse(document: DocumentNode): IMutationDefinition {

  let variables, name;

  const fragments = document.definitions.filter(
    (x: DefinitionNode) => x.kind === 'FragmentDefinition',
  );

  const queries = document.definitions.filter(
    (x: DefinitionNode) => x.kind === 'OperationDefinition' && x.operation === 'query',
  );

  const mutations = document.definitions.filter(
    (x: DefinitionNode) => x.kind === 'OperationDefinition' && x.operation === 'mutation',
  );

  const subscriptions = document.definitions.filter(
    (x: DefinitionNode) => x.kind === 'OperationDefinition' && x.operation === 'subscription',
  );

  invariant(!fragments.length || (queries.length || mutations.length || subscriptions.length),
    `Passing only a fragment to 'graphql' is not yet supported. You must include a query, subscription or mutation as well`,
  );
  invariant(((queries.length + mutations.length + subscriptions.length) <= 1),
    // tslint:disable-line
    `apollo-redux-form only supports a mutation per HOC. ${document} had ${queries.length} queries, ${subscriptions.length} subscriptions and ${mutations.length} muations. You can use 'compose' to join multiple operation types to a component`,
  );

  const definitions = mutations;

  invariant(definitions.length === 1,
    // tslint:disable-line
    `apollo-redux-form only supports one defintion per HOC. ${document} had ${definitions.length} definitions.`,
  );

  const definition = definitions[0] as OperationDefinitionNode;
  variables = definition.variableDefinitions || [];
  let hasName = definition.name && definition.name.kind === 'Name';
  name = hasName && definition.name ? definition.name.value : 'data';
  return { name, variables };

}

function buildFieldName(variable: VariableNode): string {
  return variable.name.value;
}

function buildFieldType(type: TypeNode): string {
  invariant( (type.kind == 'NamedType'),
    // tslint:disable-line
    `apollo-redux-form only supports NamedType as variable type`,
  );
  const { name: { value }} = type as NamedTypeNode;
  let typeName = 'text';
  switch ( value ){
    case 'String':
      typeName = 'text';
      break;
    case 'Int':
      typeName = 'number';
      break;
    case 'Float':
      typeName = 'number';
      break;
    case 'Boolean':
      typeName = 'checkbox';
      break;
  }
  return typeName;
}

function buildField(node: VariableDefinitionNode): JSX.Element {
  const { variable, type } = node;
  const fieldName = buildFieldName( variable );
  const fieldType = buildFieldType( type );
  return (
    <Field key={fieldName}
           name={fieldName}
           component="input"
           type={fieldType}
    />
  );
}

export function buildForm(document: DocumentNode, options: ApolloFormInterface = {}): typeof Component & Form<FormData, any, any>{
  const { initialValues } = options;
  const { name, variables } = parse(document);
  const fields = variables.map(buildField);
  const withForm = reduxForm({
    form: name,
    initialValues,
  });
  return withForm( class FormComponent extends React.Component<any, any> {
    render(){
      const { handleSubmit } = this.props;
      return (
        <form onSubmit={handleSubmit}>
          {fields}
          <button type='submit'>Submit</button>
        </form>
      );
    }
  });
}


export interface ApolloFormInterface {
  initialValues?: FormData;
  loading?: boolean;
}

export const initForm = (document: DocumentNode): any => graphql(document, {
  props: ({ ownProps, data: { loading, initialValues } }) => ({
    loading,
    initialValues
  }),
});

export function apolloForm(
  document: DocumentNode,
  // apollo options e.g.
  // * updateQueries
  //
  options: ApolloFormInterface = {}
){

  const withData = graphql(document, {
    props: ({ mutate }) => ({
      // variables contains right fields
      // because form is created from mutation variables
      handleSubmit: (variables: any) => mutate({
        variables,
        ... options
      })
    })
  });

  return (props: any) => withData(buildForm(document, props));
}
