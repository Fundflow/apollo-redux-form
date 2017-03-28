import * as React from 'react';

import { assert, expect } from 'chai';
import * as sinon from 'sinon';

import gql from 'graphql-tag';
import {
  apolloForm,
} from '../src/index';

import { createStore, combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import { Provider } from 'react-redux';

const reducers = {
  form: formReducer,
};
const reducer = combineReducers(reducers);
const store = createStore(reducer);

import { render, mount } from 'enzyme';

import ApolloClient from 'apollo-client';
import { ApolloProvider } from 'react-apollo';
import { mockNetworkInterface } from 'apollo-test-utils';

const globalAny: any = global;

// some dirty hacks following
// http://stackoverflow.com/questions/40743131/how-to-prevent-property-does-not-exist-on-type-global-with-jsdom-and-t
const jsdom = require('jsdom'); // tslint:disable-line
const document = jsdom.jsdom('<!doctype html><html><body></body></html>');
globalAny.document = document;
globalAny.window = document.defaultView;

describe('apolloForm', () => {

  it('executes mutation on submit', (done: any) => {
    const query = gql`
      mutation createPost($title: String, $isDraft: Boolean, $views: Int, $average: Float) {
        createPost(title: $title, isDraft: $isDraft, views: $views, average: $average) {
          id
          createdAt
        }
      }`;
    const data = { createPost: { id: '123', createdAt: '2011.12.12' } };
    const networkInterface = mockNetworkInterface({ request: { query }, result: { data } });
    const client = new ApolloClient({ networkInterface, addTypename: false });

    const CreatePostForm = apolloForm(query, {
      onSubmit(response: any) {
        expect(response).to.deep.equal({ data });
        done();
      },
    });

    const wrapper = mount(
      <ApolloProvider client={client}>
        <CreatePostForm />
      </ApolloProvider>,
    );

    wrapper.find('button').simulate('submit');


  });

});
