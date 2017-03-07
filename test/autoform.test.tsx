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

  it('builds a form with custom types', () => {
    // enum as input? -> select
    const CreatePostForm = buildForm(gql`

      input InputDate {

      }

      input TextArea {
        value: String
      }

      mutation createPost($title: String, createdAt: InputDate, content: TextArea) {
        createPost(title: $title, content: $content.value, createAt: $createdAt) {
          id
          createdAt
        }
      }`);
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
