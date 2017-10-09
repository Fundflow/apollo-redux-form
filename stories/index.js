import React from 'react'
import { storiesOf, action, linkTo } from '@kadira/storybook'

import ApolloClient, { NetworkInterface } from 'apollo-client'
import { ApolloProvider } from 'react-apollo'

import { createStore, combineReducers, applyMiddleware, Reducer } from 'redux'
import { reducer as formReducer } from 'redux-form'
import { Provider } from 'react-redux'

class LocalNetworkInterface implements NetworkInterface {
  query(request){
    action('apollo-query').call(undefined, request);
    return new Promise( (resolve, reject) => {
      /* do nothing */
    });
  }
}

import CreatePostForm, { query } from './CreatePostForm';
import CreateUserForm from './CustomFormSection';

const data = { createPost: { id: '123', createdAt: '2011.12.12' } };
const networkInterface = new LocalNetworkInterface();
const client = new ApolloClient({ networkInterface, addTypename: false });

const store = createStore(
  combineReducers({
    form: formReducer,
    apollo: client.reducer()
  }),
  {}, // init state
  applyMiddleware(client.middleware())
);

storiesOf('Create post', module)
  .add('send data via Apollo', () => (
    <ApolloProvider client={client}>
      <Provider store={store}>
        <CreatePostForm />
      </Provider>
    </ApolloProvider>
  ));

storiesOf('Create user', module)
    .add('with separate section for company info', () => (
        <ApolloProvider client={client}>
            <Provider store={store}>
                <CreateUserForm />
            </Provider>
        </ApolloProvider>
    ));
