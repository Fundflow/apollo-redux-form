import * as React from 'react';

import { Field, FormSection } from 'redux-form';
import { BaseFieldProps } from '@types/redux-form/lib/Field';

import {
  FieldProps,
  isScalar,
} from './apolloForm';
import { fromCamelToHuman } from './utils';

export type FormFieldRenderFunction =  (props: FieldProps) => JSX.Element;

export type FormFieldRenderer = {
  render: FormFieldRenderFunction;
} & BaseFieldProps;

export interface FormFieldRenderers {
  [key: string]: FormFieldRenderFunction | FormFieldRenderer;
}

const defaultRenderField = (Component: any, type: string) => (props: FieldProps) => {
  const { input, label, meta: { touched, error, warning }, ...rest } = props;
  return (
    <div>
      <label>{label}</label>
      <div>
        <Component type={type} {...input} placeholder={label} {...rest} />
        {touched && ((error && <span>{error}</span>) || (warning && <span>{warning}</span>))}
      </div>
    </div>
  );
};

const defaultHiddenField = (props: FieldProps) => {
  const { input, meta, ...rest } = props;
  return (
    <input type='hidden' {...input} {...rest} />
  );
};

const defaultRenderSelectField = (props: FieldProps) => {
  const { input, label, options, meta: { touched, error, warning }, ...rest } = props;
  return (
    <div>
      <label>{label}</label>
      <div>
        <select {...input} {...rest} >
          {options.map( ({key, value}) =>
              <option key={key} value={value}>{value}</option> )}
        </select>
        {touched && ((error && <span>{error}</span>) || (warning && <span>{warning}</span>))}
      </div>
    </div>
  );
};

const defaultFieldRenderers: FormFieldRenderers = {
  'String': defaultRenderField('input', 'text'),
  'Int': defaultRenderField('input', 'number'),
  'Float': defaultRenderField('input', 'number'),
  'Boolean': defaultRenderField('input', 'checkbox'),
  'ID': defaultHiddenField,
};

export interface SelectOption {
  key: string;
  value: string;
}

export class FormBuilder {
  createInputField(renderer: FormFieldRenderer, name: string, type: string, required?: boolean) {
    const { render, ...rest } = renderer;
    const renderFn = render || defaultFieldRenderers[ type ];
    const hidden = type === 'ID';
    return (
      <Field
        key={name}
        name={name}
        label={fromCamelToHuman(name)}
        required={required && !hidden}
        component={renderFn}
        {...rest}
      />
    );
  }
  createFormSection(name: string, children: JSX.Element[]) {
    return (
      <FormSection name={name} key={name}>
        { children }
      </FormSection>
    );
  }
  createSelectField(renderer: FormFieldRenderer, name: string, type: string, options: SelectOption[], required?: boolean) {
    const { render, ...rest } = renderer;
    const renderFn = render || defaultRenderSelectField;
    return (
      <Field key={name} name={name} label={fromCamelToHuman(name)} required={required}
             component={renderFn} options={options} {...rest} />
    );
  }
}
