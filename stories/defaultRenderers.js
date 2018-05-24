import React from 'react';

import * as moment from 'moment';

import { DatePicker, Form, Input, InputNumber, Switch } from 'antd';

const renderers = {
  Date: {
    render: props => {
      const {
        input,
        label,
        meta: { error, warning },
        ...rest
      } = props;
      const validateStatus = error ? 'error' : warning ? 'warning' : undefined;
      return (
        <Form.Item
          validateStatus={validateStatus}
          help={error || warning}
          label={label}
        >
          <DatePicker placeholder={label} {...input} {...rest} />
        </Form.Item>
      );
    },
    format: value => (value ? moment(value, 'YYYY-MM-DD') : null),
    normalize: value => (value ? value.format('YYYY-MM-DD') : ''),
  },
  DateTime: {
    render: props => {
      const {
        input,
        label,
        meta: { error },
        ...rest
      } = props;
      return (
        <Form.Item
          validateStatus={error ? 'error' : undefined}
          help={error}
          label={label}
        >
          <DatePicker placeholder={label} {...input} {...rest} />
        </Form.Item>
      );
    },
    format: value => (value ? moment(value, 'YYYY-MM-DDTHH:MM:SS') : null),
    normalize: value => (value ? value.format('YYYY-MM-DDTHH:MM:SS') : ''),
  },
  String: props => {
    const {
      input,
      label,
      meta: { error },
      ...rest
    } = props;
    return (
      <Form.Item
        validateStatus={error ? 'error' : undefined}
        help={error}
        label={label}
      >
        <Input {...input} type="text" placeholder={label} {...rest} />
      </Form.Item>
    );
  },
  Float: props => {
    const {
      input,
      label,
      meta: { error },
      ...rest
    } = props;
    return (
      <Form.Item
        validateStatus={error ? 'error' : undefined}
        help={error}
        label={label}
      >
        <InputNumber
          {...input}
          placeholder={label}
          {...rest}
          step={0.01}
          defaultValue={0}
        />
      </Form.Item>
    );
  },
  Int: props => {
    const {
      input,
      label,
      meta: { error },
      ...rest
    } = props;
    return (
      <Form.Item
        validateStatus={error ? 'error' : undefined}
        help={error}
        label={label}
      >
        <InputNumber
          {...input}
          placeholder={label}
          {...rest}
          defaultValue={0}
        />
      </Form.Item>
    );
  },
  Boolean: props => {
    const {
      input,
      label,
      meta: { error },
      ...rest
    } = props;
    return (
      <Form.Item
        label={label}
        validateStatus={error ? 'error' : undefined}
        help={error}
      >
        <Switch {...input} {...rest} checked={!!input.value} />
      </Form.Item>
    );
  },
};

export default renderers;
