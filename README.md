> *Warning.* This project is still WIP. Feedback is welcome.

# Apollo ReduxForm

[![Greenkeeper badge](https://badges.greenkeeper.io/Fundflow/apollo-redux-form.svg)](https://greenkeeper.io/)

ReduxForm powered by Apollo and GraphQL

## Features

* Build forms from GraphQL mutations
* Init forms from GraphQL queries
* Store form state in Redux with ReduxForm
* Submit forms via Apollo

## install

```
npm install @fundflow/apollo-redux-form
```

## How it works

Forms are built from mutation arguments, automagically.

```js
const query = gql`
  mutation createPost($title: String!, $isDraft: Boolean, $views: Int, $average: Float) {
    createPost(title: $title, isDraft: $isDraft, views: $views, average: $average) {
      id
      createdAt
    }
  }`;
const CreatePostForm = apolloForm(query);

// CreatePostForm is a React component implementing a form with input fields corresponding to the mutation arguments

```

When submit button is clicked, the GraphQL mutation is executed.

It is possible to pre-fill a form with the results of a GraphQL query.

```js
const query = gql`
  query getPost($id: ID) {
    getPost(id: $id) {
      id title isDraft views average createdAt
    }
  }`;
const withInit = initForm(query, { variables: { id: '123' } });
const PrefilledUpdatePostForm = withInit(apolloForm( /* ... */));
```

## A quick look

Some user stories powered by React Storybook.

```
$ npm install
$ npm run compile
$ npm run storybook
// point your browser to http://localhost:6006/
```

## References

* [GraphQL AST](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/graphql/language/ast.d.ts)
