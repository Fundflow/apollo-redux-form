import React from 'react';

import defaultRenderers from './defaultRenderers';

import { Tabs } from 'antd';
const TabPane = Tabs.TabPane;

import gql from 'graphql-tag'
import {
  apolloForm
} from '../lib/src/index';

import {
  capitalizeFirstLetter
} from './utils';

const schema = gql`
  input UserInput {
    profile: ProfileInput
    address: AddressInput
    company: CompanyInput
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
  input ProfileInput {
    name: String
    surname: String
  }
`;

export const query = gql`
  mutation createUser($user: UserInput) {
    createUser(user: $user) {
      id
      createdAt
    }
  }`;
const TabbedForm = apolloForm(query, {
  schema,
  renderers: {
    ...defaultRenderers,
    UserInput: (props) => {
      return (
        <Tabs defaultActiveKey="1">
          {
            props.children.map( (child, index) => {
              return (
                <TabPane tab={capitalizeFirstLetter(child.props.name)} key={index}>
                  {child}
                </TabPane>
              );
            })
          }
        </Tabs>
      );
    }
  }
});

export default TabbedForm;