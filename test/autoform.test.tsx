import * as React from 'react';

import { assert, expect } from 'chai';
import * as sinon from 'sinon';

import * as moment from 'moment';

import gql from 'graphql-tag';
import {
  FieldProps,
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

  it('builds a form with custom fields for default scalar types', () => {
    const UpdatePostForm = buildForm(gql`
      mutation updatePost($title: String, $isDraft: Boolean) {
        createPost(title: $title, isDraft: $isDraft) {
          id
          createdAt
        }
      }`, {
        renderers: {
          String: (props: FieldProps) => {
            const { input, label, meta: { touched, error, warning }, ...rest } = props;
            return (
              <div id='myCustomField' data-desc='A fully customized field'></div>
            );
          },
        },
      });
    const wrapper = render(
      <Provider store={store}>
        <UpdatePostForm />
      </Provider>,
    );
    expect( wrapper.find('div[data-desc="A fully customized field"]') ).to.have.length(1);
  });

  it('builds a form with custom selects', () => {
    const schema = gql`
      enum Status {
        PUBLISHED
        DRAFT
        DELETED
      }
    `;
    const UpdatePostForm = buildForm(gql`
      mutation updatePost($status: Status) {
        createPost(status: $status) {
          id
          createdAt
        }
      }`, {
        schema,
        renderers: {
          Status: (props: FieldProps) => {
            const { input, label, options, meta: { touched, error, warning }, ...rest } = props;
            return (
              <ul>
                {
                  options.map( (opt: any) => <li key={opt.key} data-key={opt.key}>{opt.value}</li> )
                }
              </ul>
            );
          },
        },
      });
    const wrapper = render(
      <Provider store={store}>
        <UpdatePostForm />
      </Provider>,
    );
    expect( wrapper.find('li[data-key="PUBLISHED"]') ).to.have.length(1);
    expect( wrapper.find('li[data-key="DRAFT"]') ).to.have.length(1);
    expect( wrapper.find('li[data-key="DELETED"]') ).to.have.length(1);
  });

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
    const schema = gql`
      input AuthorInput {
        name: String
        createdAt: Int
      }

      input ContentInput {
        content: String
        status: Status
        more: AuthorInput
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
        schema,
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
    const schema = gql`
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
    const CreatePostForm = buildForm(query, {schema});

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
    const schema = gql`
      input AuthorInput {
        name: String
        createdAt: Int
      }

      input ContentInput {
        content: String!
        status: Int
      }
    `;
    const CreatePostForm = buildForm(gql`
      mutation createPost($title: String!, $isDraft: Boolean, $author: AuthorInput!, $content: ContentInput ) {
        createPost(title: $title, isDraft: $isDraft) {
          id
          createdAt
        }
      }`, {schema});
      const wrapper = render(
        <Provider store={store}>
          <CreatePostForm />
        </Provider>,
      );
      expect( wrapper.find('input[name="title"][type="text"][required]') ).to.have.length(1);
      expect( wrapper.find('input[name="isDraft"][type="checkbox"]') ).to.have.length(1);
      expect( wrapper.find('input[name="isDraft"][type="checkbox"][required]') ).to.have.length(0);
      expect( wrapper.find('input[name="author.name"][type="text"]') ).to.have.length(1);
      expect( wrapper.find('input[name="author.createdAt"][type="number"]') ).to.have.length(1);
      expect( wrapper.find('input[name="content.content"][type="text"][required]') ).to.have.length(1);
      expect( wrapper.find('input[name="content.status"][type="number"]') ).to.have.length(1);
      expect( wrapper.find('input[name="content.status"][type="number"][required]') ).to.have.length(0);

  });

  it('builds a form with custom scalar types', (done: any) => {
    const schema = gql`
      scalar Date
    `;
    const CreatePostForm = buildForm(gql`
      mutation createPost($title: String, $createdAt: Date) {
        createPost(title: $title, createAt: $createdAt) {
          id
          createdAt
        }
      }`, {
        renderers: {
          Date: {
            render: (props: FieldProps) => {
              const { input, label, meta: { touched, error, warning }, ...rest } = props;
              return (
                <div>
                  <label>{label}</label>
                  <div>
                    <input type='date' {...input} placeholder={label} {...rest} />
                    {touched && ((error && <span>{error}</span>) || (warning && <span>{warning}</span>))}
                  </div>
                </div>
              );
            },
            format: (value: string) => moment(value).format('YYYY-MM-DD'),
            normalize: (value: string) => moment(value, 'YYYY-MM-DD').toDate().getTime(),
          },
        },
        schema,
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
    const schema = gql`
      input AuthorInput {
        name: String!
        createdAt: Int
      }
    `;
    const CreatePostForm = buildForm(gql`
      mutation createPost($title: String!, $isDraft: Boolean, $author: AuthorInput ) {
        createPost(title: $title, isDraft: $isDraft) {
          id
          createdAt
        }
      }`, {schema});
    const wrapper = mount(
      <Provider store={store}>
        <CreatePostForm />
      </Provider>,
    );
    let state: any, errors: any;

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.deep.equal({
      title: 'Required field.',
      author: {
        name: 'Required field.',
      },
    });

    wrapper.find('input[name="title"]').first().simulate('change', { target: { value: 'A new required title' } });

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.deep.equal({
      author: {
        name: 'Required field.',
      },
    });

    wrapper.find('input[name="author.name"]').first().simulate('change', { target: { value: 'A new required name' } });

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.equal(undefined);

  });
});
