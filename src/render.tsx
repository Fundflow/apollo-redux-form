import * as React from 'react';

import { Field, FieldArray, BaseFieldProps, FormSection } from 'redux-form';

import {
  TypeNode,
  TypeDefinitionNode,
  InputValueDefinitionNode,
} from 'graphql';

import {
  FieldProps,
  ArrayFieldProps,
  FormSectionProps,
} from './apolloForm';

import { fromCamelToHuman } from './utils';

export type FormRenderFunction =  (props: FieldProps | ArrayFieldProps | FormSectionProps) => JSX.Element;

// XXX we should distinguish between FormFieldRender, FormSectionRender and so on
// because some properties make sense in one case, but not in the other
// see issue https://github.com/Fundflow/apollo-redux-form/issues/31
export type FormRenderer = {
  render: FormRenderFunction;
  renderers?: FormRenderers;
  customFields?: FormRenderers;
} & Partial<BaseFieldProps>;

export interface FormRenderers {
  [key: string]: FormRenderFunction | FormRenderer;
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
          {options.map( ({key, value}: {key: string; value: string}) =>
              <option key={key} value={value}>{value}</option> )}
        </select>
        {touched && ((error && <span>{error}</span>) || (warning && <span>{warning}</span>))}
      </div>
    </div>
  );
};

const defaultFieldRenderers: FormRenderers = {
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
  createInputField(
    renderer: FormRenderer,
    name: string,
    type: string,
    required?: boolean,
    typeDefinition?: TypeDefinitionNode | InputValueDefinitionNode,
  ) {
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
        typeDefinition={typeDefinition}
        {...rest as any}
      />
    );
  }
  createFormSection(
      renderer: FormRenderer,
      name: string,
      children: JSX.Element[] | any,
      required?: boolean,
      typeDefinition?: TypeDefinitionNode | InputValueDefinitionNode,
    ) {
    return (
      <FormSection name={name} key={name} required={required} component={renderer.render} typeDefinition={typeDefinition}>
        { children }
      </FormSection>
    );
  }
  createSelectField(
      renderer: FormRenderer,
      name: string,
      type: String,
      options: SelectOption[],
      required?: boolean,
      typeDefinition?: TypeDefinitionNode | InputValueDefinitionNode,
    ) {
    const { render, ...rest } = renderer;
    const renderFn = render || defaultRenderSelectField;
    return (
      <Field key={name} name={name} label={fromCamelToHuman(name)} required={required} typeDefinition={typeDefinition}
             component={renderFn} options={options} {...rest as any} />
    );
  }
  createArrayField(renderer: FormRenderer, name: string, fields: JSX.Element[] | JSX.Element | undefined,
    childType: TypeNode, required?: boolean,
    typeDefinition?: TypeDefinitionNode | InputValueDefinitionNode) {
    const { render, ...rest } = renderer;
    return (
      <FieldArray
        key={name}
        name={name}
        component={render}
        required={required}
        arrayFields={fields}
        typeDefinition={typeDefinition}
        {...rest as any}
      />
    );
  }
}
