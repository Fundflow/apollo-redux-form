import * as React from 'react'

import { assert, expect } from 'chai'
import * as sinon from 'sinon'

import gql from 'graphql-tag'
import {
  apolloForm,
  buildForm,
  initForm,
} from '../src/index';

import { createStore, combineReducers } from 'redux'
import { reducer as formReducer } from 'redux-form'
import { Provider } from 'react-redux'

const reducers = {
  form: formReducer
}
const reducer = combineReducers(reducers)
const store = createStore(reducer)

import { render, mount } from 'enzyme'

const globalAny:any = global;

// some dirty hacks following
// http://stackoverflow.com/questions/40743131/how-to-prevent-property-does-not-exist-on-type-global-with-jsdom-and-t
const jsdom = require('jsdom');
const document = jsdom.jsdom('<!doctype html><html><body></body></html>');
globalAny.document = document;
globalAny.window = document.defaultView;

describe('buildForm', () => {

  it('builds a form with scalar types', () => {
    const CreatePostForm = buildForm(gql`
      mutation createPost($title: String, $isDraft: Boolean, $views: Int, $average: Float) {
        createPost(title: $title, isDraft: $isDraft, views: $views, average: $average) {
          id
          createdAt
        }
      }`);
    const wrapper = render(
      <Provider store={store}>
        <CreatePostForm />
      </Provider>
    );
    expect( wrapper.find('input[name="title"][type="text"]') ).to.have.length(1);
    expect( wrapper.find('input[name="isDraft"][type="checkbox"]') ).to.have.length(1);
    expect( wrapper.find('input[name="views"][type="number"]') ).to.have.length(1);
    expect( wrapper.find('input[name="average"][type="number"]') ).to.have.length(1);
  });

  it('builds a form with standard input types custom inputs', () => {
    const CreatePostForm = buildForm(gql`

      input DateInput {
        value: Int
      }

      input TextAreaInput {
        value: String
      }

      mutation createPost($title: String, $createdAt: DateInput, $content: TextAreaInput) {
        createPost(title: $title, content: $content, createAt: $createdAt) {
          id
          createdAt
        }
      }`, {
        resolvers: {
          DateInput: { component: 'input', type: 'date' },
          TextAreaInput: { component: 'textarea' }
        }
      });

      const wrapper = render(
        <Provider store={store}>
          <CreatePostForm />
        </Provider>
      );

      expect( wrapper.find('input[name="createdAt"][type="date"]') ).to.have.length(1);
      expect( wrapper.find('textarea[name="content"]') ).to.have.length(1);
      expect( wrapper.find('input[name="title"][type="text"]') ).to.have.length(1);
  });

  it('builds a form with enum', () => {
    const CreatePostForm = buildForm(gql`

      enum State {
        NOT_FOUND
        ACTIVE
        INACTIVE
        SUSPENDED
      }

      mutation updatePost($id: ID, $state: State) {
        updatePost(id: $id, state: $state) {
          id
          createdAt
        }
      }`);

      const wrapper = render(
        <Provider store={store}>
          <CreatePostForm />
        </Provider>
      );

      expect( wrapper.find('select[name="state"]') ).to.have.length(1);
      expect( wrapper.find('option[value="NOT_FOUND"]') ).to.have.length(1);
      expect( wrapper.find('option[value="ACTIVE"]') ).to.have.length(1);
      expect( wrapper.find('option[value="INACTIVE"]') ).to.have.length(1);
      expect( wrapper.find('option[value="SUSPENDED"]') ).to.have.length(1);
  });

  it('builds a form with required fields', () => {
    const CreatePostForm = buildForm(gql`
      mutation createPost($title: String!, $isDraft: Boolean ) {
        createPost(title: $title, isDraft: $isDraft) {
          id
          createdAt
        }
      }`);
      const wrapper = render(
        <Provider store={store}>
          <CreatePostForm />
        </Provider>
      );
      expect( wrapper.find('input[name="title"][type="text"][required]') ).to.have.length(1);
      expect( wrapper.find('input[name="isDraft"][type="checkbox"]') ).to.have.length(1);
  });

});

describe('a form is invalid', () => {

  it('iff required fields are missing', () => {
    const CreatePostForm = buildForm(gql`
      mutation createPost($title: String!, $isDraft: Boolean ) {
        createPost(title: $title, isDraft: $isDraft) {
          id
          createdAt
        }
      }`);
    const handleSubmit = sinon.spy();
    const wrapper = mount(
      <Provider store={store}>
        <CreatePostForm />
      </Provider>
    );
    let state: any, errors: any;

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.deep.equal({ title: 'Required field.' });

    wrapper.find('input').first().simulate('change', { target: { value: 'A new required title' } });

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.equal(undefined);

  });
});
