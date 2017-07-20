// some dirty hacks following
// http://stackoverflow.com/questions/40743131/how-to-prevent-property-does-not-exist-on-type-global-with-jsdom-and-t
const globalAny: any = global;
const jsdom = require('jsdom'); // tslint:disable-line
const document = jsdom.jsdom('<!doctype html><html><body></body></html>');
globalAny.document = document;
globalAny.window = document.defaultView;

import * as React from 'react';

import { assert, expect } from 'chai';
import { mount } from 'enzyme';

import gql from 'graphql-tag';
import {
  initForm, buildForm, apolloForm,
} from '../src/index';

import ApolloClient from 'apollo-client';
import { ApolloProvider } from 'react-apollo';
import { mockNetworkInterface } from 'apollo-test-utils';

import { createStore, combineReducers, applyMiddleware, Reducer } from 'redux';
import { reducer as formReducer } from 'redux-form';
import { Provider } from 'react-redux';

describe('initForm', () => {

  const query = gql`
    query getPost($id: ID) {
      getPost(id: $id) {
        id title isDraft views average createdAt
      }
    }`;
  const variables = { id: '123' };
  const data = { getPost: {
    id: '123',
    title: 'A title',
    isDraft: true,
    views: 100,
    average: 20.50,
    createdAt: '2011.12.12',
  } };

  it('initializes redux-form with initial values from query', (done: any) => {

    const networkInterface = mockNetworkInterface({ request: { query, variables }, result: { data } });
    const client = new ApolloClient({ networkInterface, addTypename: false });
    const withInit = initForm(query, { variables: { id: '123' } });

    const UpdatePostForm = withInit(buildForm(gql`
      mutation updatePostFormPost($id: ID, $title: String, $isDraft: Boolean, $views: Int, $average: Float) {
        createPost(id: $id, title: $title, isDraft: $isDraft, views: $views, average: $average) {
          id
          updatedAt
        }
      }`));

    const store = createStore(
      combineReducers({
        form: formReducer,
        // XXX client.reducer() type too generic
        apollo: client.reducer() as Reducer<any>,
      }),
      {}, // init state
      applyMiddleware(client.middleware()),
    );

    const wrapper = mount(
      <ApolloProvider client={client}>
        <Provider store={store}>
            <UpdatePostForm />
        </Provider>
      </ApolloProvider>,
    );

    // XXX how to wait until initial values are loaded?
    setTimeout( () => {
      const initialValues = store.getState()['form']['updatePostFormPost']['initial'];
      expect(initialValues).to.deep.equal( data['getPost'] );
      done();
    }, 500);


  });

  it('initializes apollo-form with initial values from query', (done: any) => {

    const networkInterface = mockNetworkInterface({ request: { query, variables }, result: { data } });
    const client = new ApolloClient({ networkInterface, addTypename: false });
    const withInit = initForm(query, { variables: { id: '123' } });

    const UpdatePostForm = withInit(apolloForm(gql`
      mutation updatePostFormPost($id: ID, $title: String, $isDraft: Boolean, $views: Int, $average: Float) {
        createPost(id: $id, title: $title, isDraft: $isDraft, views: $views, average: $average) {
          id
          updatedAt
        }
      }`));

    const store = createStore(
      combineReducers({
        form: formReducer,
        // XXX client.reducer() type too generic
        apollo: client.reducer() as Reducer<any>,
      }),
      {}, // init state
      applyMiddleware(client.middleware()),
    );

    const wrapper = mount(
      <ApolloProvider client={client}>
        <Provider store={store}>
            <UpdatePostForm />
        </Provider>
      </ApolloProvider>,
    );

    // XXX how to wait until initial values are loaded?
    setTimeout( () => {
      const initialValues = store.getState()['form']['updatePostFormPost']['initial'];
      expect(initialValues).to.deep.equal( data['getPost'] );
      done();
    }, 500);
  });

  it('executes mutation on submit and removes spurious fields', (done: any) => {
    const schema = gql`
      input AuthorInput {
        name: String
        createdAt: Int
      }
    `;
    const createQuery = gql`
      mutation createPost($title: String, $author: AuthorInput) {
        createPost(title: $title, author: $author) {
          id
          createdAt
        }
      }`;
    const initialValues = {
      title: 'This is a title',
      spurious: true,
      author: {
        name: 'This is a name',
        createdAt: 0,
        spurious: true,
      },
    };
    const mutationVariables = {
      title: 'This is a title',
      author: {
        name: 'This is a name',
        createdAt: 0,
      },
    };
    const resultData = { createPost: { id: '123', createdAt: '2011.12.12' } };
    const networkInterface = mockNetworkInterface({
      request: { query: createQuery, variables: mutationVariables },
      result: { data: resultData },
    });
    const client = new ApolloClient({ networkInterface, addTypename: false });
    /* eslint-disable no-underscore-dangle */
    const store = createStore(
      combineReducers({
        form: formReducer,
        apollo: client.reducer() as Reducer<any>,
      }),
      applyMiddleware(client.middleware()),
    );
    /* eslint-enable */
    const CreatePostForm = apolloForm(createQuery, {
      schema,
      onSubmitSuccess(response: any) {
        expect(response).to.deep.equal( resultData.createPost );
        done();
      },
    });

    const wrapper = mount(
      <ApolloProvider client={client} store={store}>
        <CreatePostForm initialValues={initialValues} />
      </ApolloProvider>,
    );

    wrapper.find('button').simulate('submit');


  });

});
