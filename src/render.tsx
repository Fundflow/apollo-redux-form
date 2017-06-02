import * as React from 'react';

import { Field, FormSection } from 'redux-form';

import {
  FormFieldRenderers,
  FormFieldRenderer,
  FormFieldRenderFunction,
  FieldProps,
  isScalar,
} from './apolloForm';
import { fromCamelToHuman } from './utils';

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
  const { input, label, children, meta: { touched, error, warning }, ...rest } = props;
  return (
    <div>
      <label>{label}</label>
      <div>
        <select {...input} {...rest} >
          {children}
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

function isRenderFunction(x: FormFieldRenderFunction | FormFieldRenderer): x is FormFieldRenderFunction {
  return (x as FormFieldRenderer).render === undefined;
}

export interface SelectOption {
  key: string;
  value: string;
}

export class FormBuilder {
  createInputField(name: string, type: string, required?: boolean) {
    const renderer = defaultFieldRenderers[ type ];
    const hidden = type === 'ID';
    return (
      <Field
        key={name}
        name={name}
        label={fromCamelToHuman(name)}
        required={required && !hidden}
        component={renderer}
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
  createSelectField(name: string, type: string, options: SelectOption[], required?: boolean) {
    return (
      <Field key={name} name={name} label={fromCamelToHuman(name)} required={required}
             component={defaultRenderSelectField} >
           {options.map( ({key, value}) =>
                 <option key={key} value={value}>{value}</option> )}
      </Field>
    );
  }
  createCustomField(name: string, type: string, renderer: FormFieldRenderFunction | FormFieldRenderer, required?: boolean) {
    if ( isRenderFunction(renderer) ) {
      return (
        <Field key={name} name={name} label={fromCamelToHuman(name)} required={required}
               component={renderer} />
      );
    } else {
      const { render, ...rest} = renderer;
      return (
        <Field key={name} name={name} required={required}
               label={fromCamelToHuman(name)}
               component={render} {...rest} />
      );
    }
  }
}
