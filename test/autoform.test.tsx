import * as React from 'react';

import { assert, expect } from 'chai';
import * as sinon from 'sinon';

import * as moment from 'moment';

import gql from 'graphql-tag';
import {
  apolloForm,
  buildForm,
  initForm,
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

const globalAny: any = global;

// some dirty hacks following
// http://stackoverflow.com/questions/40743131/how-to-prevent-property-does-not-exist-on-type-global-with-jsdom-and-t
const jsdom = require('jsdom'); // tslint:disable-line
const document = jsdom.jsdom('<!doctype html><html><body></body></html>');
globalAny.document = document;
globalAny.window = document.defaultView;

describe('buildForm', () => {

  it('builds a form where fields of type ID are hidden', () => {
    const UpdatePostForm = buildForm(gql`
      mutation updatePost($id: ID) {
        createPost(id: $id) {
          id
          createdAt
        }
      }`);
    const wrapper = render(
      <Provider store={store}>
        <UpdatePostForm />
      </Provider>,
    );
    expect( wrapper.find('input[name="id"][type="hidden"]') ).to.have.length(1);
  });

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
      </Provider>,
    );
    expect( wrapper.find('input[name="title"][type="text"]') ).to.have.length(1);
    expect( wrapper.find('input[name="isDraft"][type="checkbox"]') ).to.have.length(1);
    expect( wrapper.find('input[name="views"][type="number"]') ).to.have.length(1);
    expect( wrapper.find('input[name="average"][type="number"]') ).to.have.length(1);
  });

  it('builds a form with standard input types custom inputs', () => {
    const defs = gql`
      input AuthorInput {
        name: String
        createdAt: Int
      }

      input ContentInput {
        content: String
        status: Status
      }

      enum Status {
        PUBLISHED
        DRAFT
        DELETED
      }
    `;
    const CreatePostForm = buildForm(gql`
      mutation createPost($title: String, $author: AuthorInput, $content: ContentInput) {
        createPost(title: $title, author: $author, content: $content) {
          id
          createdAt
        }
      }`, {
        defs,
      });

      const wrapper = render(
        <Provider store={store}>
          <CreatePostForm />
        </Provider>,
      );

      expect( wrapper.find('input[name="title"][type="text"]') ).to.have.length(1);
      expect( wrapper.find('input[name="author.name"]') ).to.have.length(1);
      expect( wrapper.find('input[name="author.createdAt"]') ).to.have.length(1);
      expect( wrapper.find('input[name="content.content"]') ).to.have.length(1);
      expect( wrapper.find('select[name="content.status"]') ).to.have.length(1);
  });

  it('builds a form with enum', () => {
    const defs = gql`
      enum State {
        NOT_FOUND
        ACTIVE
        INACTIVE
        SUSPENDED
      }
    `;
    const query = gql`
      mutation updatePost($id: ID, $state: State) {
        updatePost(id: $id, state: $state) {
          id
          createdAt
        }
      }`;
    const CreatePostForm = buildForm(query, {defs});

      const wrapper = render(
        <Provider store={store}>
          <CreatePostForm />
        </Provider>,
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
        </Provider>,
      );
      expect( wrapper.find('input[name="title"][type="text"][required]') ).to.have.length(1);
      expect( wrapper.find('input[name="isDraft"][type="checkbox"]') ).to.have.length(1);
  });

  it('builds a form with custom scalar types', (done: any) => {
    const defs = gql`
      scalar Date
    `;
    const CreatePostForm = buildForm(gql`
      mutation createPost($title: String, $createdAt: Date) {
        createPost(title: $title, createAt: $createdAt) {
          id
          createdAt
        }
      }`, {
        resolvers: {
          Date: {
            component: 'input',
            type: 'date',
            format: (value: string) => moment(value).format('YYYY-MM-DD'),
            normalize: (value: string) => moment(value, 'YYYY-MM-DD').toDate().getTime(),
          },
        },
        defs,
      });
      const createdAt = Date.now();
      const formattedTime = moment(createdAt).format('YYYY-MM-DD');
      const initialValues = { createdAt };
      const handleSubmit = (data: any) => {
        expect(data).to.deep.equal({ createdAt });
        done();
      };

      const wrapper = mount(
        <Provider store={store}>
          <CreatePostForm initialValues={initialValues} onSubmit={handleSubmit} />
        </Provider>,
      );

      const selector = `input[name="createdAt"][type="date"][value="${formattedTime}"]`;

      expect( wrapper.find(selector) ).to.have.length(1);

      wrapper.find('form').simulate('submit');

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
    const wrapper = mount(
      <Provider store={store}>
        <CreatePostForm />
      </Provider>,
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
