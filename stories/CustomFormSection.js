import React from 'react';

import gql from 'graphql-tag'
import {
    apolloForm
} from '../lib/src/index';

const schema = gql`
  input UserInput {
    name: String
    company: CompanyInput
    wage: AmountInput
  }
  input CompanyInput {
    legalName: String
    address: AddressInput
  }
  input AddressInput {
    street: String
    streetNumber: String
    city: String
  }
  input AmountInput {
    value: Float
    currency: Currency
  }
  enum Currency {
    EUR
    GBP
    USD
  }
`;

export const query = gql`
  mutation createUser($user: UserInput) {
    createUser(user: $user) {
      id
      createdAt
    }
  }`;
const CreateUserForm = apolloForm(query, {
    schema,
    renderers: {
        CompanyInput: (props) => {
            return (
                <div style={{border: '1px solid black'}}>
                    {props.children}
                </div>
            );
        },
        AddressInput: (props) => {
            return (
                <div style={{border: '1px solid red'}}>
                    {props.children}
                </div>
            );
        }
    },
    customFields: {
        'user.wage': (props) => {
            return (
                <div style={{border: '1px solid blue'}}>
                    {props.children}
                </div>
            );
        }
    }
});

export default CreateUserForm;