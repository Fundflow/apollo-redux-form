import * as React from 'react';

import { assert, expect } from 'chai';
import * as sinon from 'sinon';

import * as moment from 'moment';

import gql from 'graphql-tag';
import { FieldProps, apolloForm, buildForm, initForm } from '../src/index';

import { createStore, combineReducers } from 'redux';
import { reducer as formReducer, FieldArray } from 'redux-form';
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
var jsdom = require('jsdom'); // tslint:disable-line
const { JSDOM } = jsdom;
const { document } = new JSDOM('').window;
globalAny.document = document;
globalAny.window = document.defaultView;

describe('buildForm', () => {
  it('builds a form with custom fields for default scalar types', () => {
    const UpdatePostForm = buildForm(
      gql`
        mutation updatePost($title: String, $isDraft: Boolean) {
          createPost(title: $title, isDraft: $isDraft) {
            id
            createdAt
          }
        }
      `,
      {
        renderers: {
          String: (props: FieldProps) => {
            const {
              input,
              label,
              meta: { touched, error, warning },
              ...rest
            } = props;
            return (
              <div id="myCustomField" data-desc="A fully customized field" />
            );
          },
        },
      }
    );
    const wrapper = render(
      <Provider store={store}>
        <UpdatePostForm />
      </Provider>
    );
    expect(
      wrapper.find('div[data-desc="A fully customized field"]')
    ).to.have.length(1);
  });

  it('builds a form with custom selects', () => {
    const schema = gql`
      enum Status {
        PUBLISHED
        DRAFT
        DELETED
      }
    `;
    const UpdatePostForm = buildForm(
      gql`
        mutation updatePost($status: Status) {
          createPost(status: $status) {
            id
            createdAt
          }
        }
      `,
      {
        schema,
        renderers: {
          Status: (props: FieldProps) => {
            const {
              input,
              label,
              options,
              meta: { touched, error, warning },
              ...rest
            } = props;
            return (
              <ul>
                {options.map((opt: any) => (
                  <li key={opt.key} data-key={opt.key}>
                    {opt.value}
                  </li>
                ))}
              </ul>
            );
          },
        },
      }
    );
    const wrapper = render(
      <Provider store={store}>
        <UpdatePostForm />
      </Provider>
    );
    expect(wrapper.find('li[data-key="PUBLISHED"]')).to.have.length(1);
    expect(wrapper.find('li[data-key="DRAFT"]')).to.have.length(1);
    expect(wrapper.find('li[data-key="DELETED"]')).to.have.length(1);
  });

  it('builds a form with custom field', () => {
    const schema = gql`
      input AuthorInput {
        name: String
        createdAt: Int
      }
    `;
    const UpdatePostForm = buildForm(
      gql`
        mutation updatePost($title: String, $author: AuthorInput) {
          createPost(title: $title, author: $author) {
            id
            createdAt
          }
        }
      `,
      {
        schema,
        customFields: {
          title: {
            render: (props: FieldProps) => {
              const {
                input,
                label,
                meta: { touched, error, warning },
                ...rest
              } = props;
              return (
                <div>
                  <label>{label}</label>
                  <div>
                    <input
                      type="text"
                      {...input}
                      placeholder={label}
                      {...rest}
                      data-custom="custom"
                    />
                    {touched &&
                      ((error && <span>{error}</span>) ||
                        (warning && <span>{warning}</span>))}
                  </div>
                </div>
              );
            },
            format: (value?: string) => (value ? value.toUpperCase() : ''),
            normalize: (value?: string) => (value ? value.toLowerCase() : ''),
          },
          'author.name': (props: FieldProps) => {
            const {
              input,
              label,
              meta: { touched, error, warning },
              ...rest
            } = props;
            return (
              <div>
                <label>{label}</label>
                <div>
                  <input
                    type="text"
                    {...input}
                    placeholder={label}
                    {...rest}
                    data-custom="custom"
                  />
                  {touched &&
                    ((error && <span>{error}</span>) ||
                      (warning && <span>{warning}</span>))}
                </div>
              </div>
            );
          },
        },
      }
    );
    const wrapper = mount(
      <Provider store={store}>
        <UpdatePostForm />
      </Provider>
    );

    wrapper
      .find('input[name="title"]')
      .first()
      .simulate('change', { target: { value: 'must be upper cased' } });

    expect(
      wrapper.find(
        'input[name="title"][data-custom="custom"][value="MUST BE UPPER CASED"]'
      )
    ).to.have.length(1);
    expect(
      wrapper.find('input[name="author.name"][data-custom="custom"]')
    ).to.have.length(1);

    let state: any;
    let values: any;

    state = store.getState();
    values = state['form']['updatePost']['values'];
    expect(values).to.deep.equal({
      title: 'must be upper cased',
    });
  });

  it('builds a form where fields of type ID are hidden', () => {
    const UpdatePostForm = buildForm(gql`
      mutation updatePost($id: ID) {
        createPost(id: $id) {
          id
          createdAt
        }
      }
    `);
    const wrapper = render(
      <Provider store={store}>
        <UpdatePostForm />
      </Provider>
    );
    expect(wrapper.find('input[name="id"][type="hidden"]')).to.have.length(1);
  });

  it('builds a form with scalar types', () => {
    const CreatePostForm = buildForm(gql`
      mutation createPost(
        $title: String
        $isDraft: Boolean
        $views: Int
        $average: Float
      ) {
        createPost(
          title: $title
          isDraft: $isDraft
          views: $views
          average: $average
        ) {
          id
          createdAt
        }
      }
    `);
    const wrapper = render(
      <Provider store={store}>
        <CreatePostForm />
      </Provider>
    );
    expect(wrapper.find('input[name="title"][type="text"]')).to.have.length(1);
    expect(
      wrapper.find('input[name="isDraft"][type="checkbox"]')
    ).to.have.length(1);
    expect(wrapper.find('input[name="views"][type="number"]')).to.have.length(
      1
    );
    expect(wrapper.find('input[name="average"][type="number"]')).to.have.length(
      1
    );
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
    const CreatePostForm = buildForm(
      gql`
        mutation createPost(
          $title: String
          $author: AuthorInput
          $content: ContentInput
        ) {
          createPost(title: $title, author: $author, content: $content) {
            id
            createdAt
          }
        }
      `,
      {
        schema,
      }
    );

    const wrapper = render(
      <Provider store={store}>
        <CreatePostForm />
      </Provider>
    );

    expect(wrapper.find('input[name="title"][type="text"]')).to.have.length(1);
    expect(wrapper.find('input[name="author.name"]')).to.have.length(1);
    expect(wrapper.find('input[name="author.createdAt"]')).to.have.length(1);
    expect(wrapper.find('input[name="content.content"]')).to.have.length(1);
    expect(wrapper.find('select[name="content.status"]')).to.have.length(1);
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
      }
    `;
    const CreatePostForm = buildForm(query, { schema });

    const wrapper = render(
      <Provider store={store}>
        <CreatePostForm />
      </Provider>
    );

    expect(wrapper.find('select[name="state"]')).to.have.length(1);
    expect(wrapper.find('option[value="NOT_FOUND"]')).to.have.length(1);
    expect(wrapper.find('option[value="ACTIVE"]')).to.have.length(1);
    expect(wrapper.find('option[value="INACTIVE"]')).to.have.length(1);
    expect(wrapper.find('option[value="SUSPENDED"]')).to.have.length(1);
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
    const CreatePostForm = buildForm(
      gql`
        mutation createPost(
          $title: String!
          $isDraft: Boolean
          $author: AuthorInput!
          $content: ContentInput
        ) {
          createPost(title: $title, isDraft: $isDraft) {
            id
            createdAt
          }
        }
      `,
      { schema }
    );
    const wrapper = render(
      <Provider store={store}>
        <CreatePostForm />
      </Provider>
    );
    expect(
      wrapper.find('input[name="title"][type="text"][required]')
    ).to.have.length(1);
    expect(
      wrapper.find('input[name="isDraft"][type="checkbox"]')
    ).to.have.length(1);
    expect(
      wrapper.find('input[name="isDraft"][type="checkbox"][required]')
    ).to.have.length(0);
    expect(
      wrapper.find('input[name="author.name"][type="text"]')
    ).to.have.length(1);
    expect(
      wrapper.find('input[name="author.createdAt"][type="number"]')
    ).to.have.length(1);
    expect(
      wrapper.find('input[name="content.content"][type="text"][required]')
    ).to.have.length(1);
    expect(
      wrapper.find('input[name="content.status"][type="number"]')
    ).to.have.length(1);
    expect(
      wrapper.find('input[name="content.status"][type="number"][required]')
    ).to.have.length(0);
  });

  it('builds a form with custom validation', () => {
    const CreatePostForm = buildForm(
      gql`
        mutation createPost($title: String!, $isDraft: Boolean) {
          createPost(title: $title, isDraft: $isDraft) {
            id
            createdAt
          }
        }
      `,
      {
        validate(values: any) {
          const { isDraft } = values;
          const errs: { isDraft?: string } = {};
          if (!isDraft) {
            errs.isDraft = 'Cannot create draft posts.';
          }
          return errs;
        },
      }
    );
    const wrapper = mount(
      <Provider store={store}>
        <CreatePostForm />
      </Provider>
    );

    let state: any;
    let errors: any;

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.deep.equal({
      title: 'Required field.',
      isDraft: 'Cannot create draft posts.',
    });

    wrapper
      .find('input[name="title"]')
      .first()
      .simulate('change', { target: { value: 'A new required title' } });

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.deep.equal({
      isDraft: 'Cannot create draft posts.',
    });

    wrapper
      .find('[name="isDraft"]')
      .first()
      .simulate('change', { target: { value: false } });

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.deep.equal({
      isDraft: 'Cannot create draft posts.',
    });

    wrapper
      .find('[name="isDraft"]')
      .first()
      .simulate('change', { target: { value: true } });

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.equal(undefined);
  });

  it('builds a form with custom scalar types', (done: any) => {
    const schema = gql`
      scalar Date
    `;
    const CreatePostForm = buildForm(
      gql`
        mutation createPost($title: String, $createdAt: Date) {
          createPost(title: $title, createAt: $createdAt) {
            id
            createdAt
          }
        }
      `,
      {
        renderers: {
          Date: {
            render: (props: FieldProps) => {
              const {
                input,
                label,
                meta: { touched, error, warning },
                ...rest
              } = props;
              return (
                <div>
                  <label>{label}</label>
                  <div>
                    <input
                      type="date"
                      {...input}
                      placeholder={label}
                      {...rest}
                    />
                    {touched &&
                      ((error && <span>{error}</span>) ||
                        (warning && <span>{warning}</span>))}
                  </div>
                </div>
              );
            },
            format: (value: string) => moment(value).format('YYYY-MM-DD'),
            normalize: (value: string) =>
              moment(value, 'YYYY-MM-DD')
                .toDate()
                .getTime(),
          },
        },
        schema,
      }
    );
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
      </Provider>
    );

    const selector = `input[name="createdAt"][type="date"][value="${formattedTime}"]`;

    expect(wrapper.find(selector)).to.have.length(1);

    wrapper.find('form').simulate('submit');
  });

  it('cannot build a form when array input fields do not define a custom field render function', () => {
    const schema = gql`
      input UserInput {
        arrayOfScalars: [String]
      }
    `;

    assert.throw(
      () =>
        buildForm(
          gql`
            mutation createUser($user: UserInput) {
              createUser(user: $user) {
                id
                createdAt
              }
            }
          `,
          {
            schema,
          }
        ),
      /List Type requires a custom field renderer/
    );
  });

  it('builds a form when array input fields define a custom field render function', () => {
    const schema = gql`
      input UserInput {
        arrayOfScalars: [String]
        requiredArrayOfScalars: [String]!
        arrayOfRequiredScalars: [String!]
        requiredArrayOfRequiredScalars: [String!]!
        arrayOfArrays: [[String]]
        requiredArrayOfArrays: [[String]]!
        arrayOfRequiredArrays: [[String]!]
        requiredArrayOfRequiredArrays: [[String]!]!
      }
    `;

    const CreateUserForm = buildForm(
      gql`
        mutation createUser($user: UserInput) {
          createUser(user: $user) {
            id
            createdAt
          }
        }
      `,
      {
        schema,
        customFields: {
          'user.arrayOfScalars': (props: any) => <div />,
          'user.requiredArrayOfScalars': (props: any) => <div />,
          'user.arrayOfRequiredScalars': (props: any) => <div />,
          'user.requiredArrayOfRequiredScalars': (props: any) => <div />,
          'user.arrayOfArrays': (props: any) => <div />,
          'user.requiredArrayOfArrays': (props: any) => <div />,
          'user.arrayOfRequiredArrays': (props: any) => <div />,
          'user.requiredArrayOfRequiredArrays': (props: any) => <div />,
        },
      }
    );

    assert.isTrue(true);
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
    const CreatePostForm = buildForm(
      gql`
        mutation createPost(
          $title: String!
          $isDraft: Boolean
          $author: AuthorInput
        ) {
          createPost(title: $title, isDraft: $isDraft) {
            id
            createdAt
          }
        }
      `,
      { schema }
    );
    const wrapper = mount(
      <Provider store={store}>
        <CreatePostForm />
      </Provider>
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

    wrapper
      .find('input[name="title"]')
      .first()
      .simulate('change', { target: { value: 'A new required title' } });

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.deep.equal({
      author: {
        name: 'Required field.',
      },
    });

    wrapper
      .find('input[name="author.name"]')
      .first()
      .simulate('change', { target: { value: 'A new required name' } });

    state = store.getState();
    errors = state['form']['createPost']['syncErrors'];
    expect(errors).to.equal(undefined);
  });
});
