import * as React from 'react'

import { assert, expect } from 'chai'

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

import { render } from 'enzyme';

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

  it('builds a form with required fields and validation', () => {
    const CreatePostForm = buildForm(gql`
      mutation createPost($title: String!) {
        createPost(title: $title, createAt: $createdAt) {
          id
          createdAt
        }
      }`);
  });

});
