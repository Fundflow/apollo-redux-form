import React from 'react';

import defaultRenderers from './defaultRenderers';

import { Input, Select, Form } from 'antd';
const InputGroup = Input.Group;
const Option = Select.Option;

import gql from 'graphql-tag';
import { apolloForm } from '../lib/src/index';

import { isValidCurrencyValue } from './utils';

const schema = gql`
  input MoneyInput {
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
  mutation addMoney($money: MoneyInput) {
    addMoney(money: $money) {
      id
      createdAt
    }
  }
`;
const MonetaryAmount = apolloForm(query, {
  schema,
  renderers: {
    ...defaultRenderers,
    MoneyInput: {
      render(props) {
        return <InputGroup compact>{props.children}</InputGroup>;
      },
      renderers: {
        Currency: {
          render: props => {
            const {
              input: { onChange, value },
              label,
              meta: { error },
            } = props;
            return (
              <Form.Item
                validateStatus={error ? 'error' : undefined}
                help={error}
              >
                <Select
                  onSelect={onChange}
                  value={value}
                  placeholder="Select a currency"
                >
                  {props.options.map(option => {
                    return (
                      <Option key={option.key} value={option.key}>
                        {option.value}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            );
          },
          validate: (value, allValues) => {
            if (
              !value &&
              allValues.money &&
              allValues.money.value !== undefined
            )
              return 'Missing currency';
            return null;
          },
        },
        Float: {
          render: props => {
            const {
              input,
              meta: { error },
            } = props;
            return (
              <Form.Item
                validateStatus={error ? 'error' : undefined}
                help={error}
              >
                <Input {...input} />
              </Form.Item>
            );
          },
          normalize: value => {
            return value.replace(',', '.');
          },
          format: value => {
            return value && value.replace('.', ',');
          },
          validate: (value, allValues) => {
            if (value == undefined || value == null) {
              if (allValues.money && allValues.money.currency) {
                return 'Missing value.';
              }
            } else if (!isValidCurrencyValue(value)) {
              return 'Invalid currency format.';
            }
            return null;
          },
        },
      },
    },
  },
});

export default MonetaryAmount;
