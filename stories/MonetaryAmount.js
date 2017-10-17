import React from 'react';

import defaultRenderers from './defaultRenderers';

import { Input, Select, InputNumber, Form} from 'antd';
const InputGroup = Input.Group;
const Option = Select.Option;

import gql from 'graphql-tag'
import {
  apolloForm
} from '../lib/src/index';

import {
  capitalizeFirstLetter
} from './utils';

const schema = gql`
  scalar MoneyValue 
  
  input MoneyInput {
    value: MoneyValue
    currency: Currency
  }
  enum Currency {
    EUR
    GBP
    USD
  }
`;

export const query = gql`
  mutation addMoney($money: MoneyInput) {
    addMoney(money: $money) {
      id
      createdAt
    }
  }`;
const MonetaryAmount = apolloForm(query, {
  schema,
  renderers: {
    ...defaultRenderers,
    MoneyInput: (props) => {
      return (
        <Form.Item label={"Monetary Amount"}>
          <InputGroup compact>
            {props.children}
          </InputGroup>
        </Form.Item>
      );
    },
    Currency: (props) => {
      const { input: {onChange, value}, label, meta: {  error }} = props;
      return (
        <Select onSelect={onChange} value={value || 'EUR'}>
          {
            props.options.map( (option) => {
              return <Option key={option.key} value={option.key}>{option.value}</Option>
            })
          }
        </Select>
      );
    },
    MoneyValue: (props) => {
      const {input} = props;
      return (
        <InputNumber {...input} />
      );
    }
  }
});

export default MonetaryAmount;