import * as React from 'react';

// tslint:disable-next-line
const _ = require('lodash');

function validateImpl(
  fields: JSX.Element[],
  values: any = {},
  isParentRequired: boolean = false,
) {
  const errors: any = Object.create(null);
  fields.forEach( (field: JSX.Element) => {
    const fieldName = field.props.name;
    const children = field.props.children;
    const isRequired = field.props.required;
    const value = values[fieldName];

    if ( children && children.length > 0 ) {
      const next = _.isObject(value) ? value : Object.create(null);
      const result = validateImpl(children, next, isRequired);
      if (!_.isEmpty(result)) {
        errors[ fieldName ] = result;
      }
    } else if (isRequired || isParentRequired) {
      if ( !value ) {
        errors[ fieldName ] = 'Required field.';
      }
    }
  });
  return errors;
}

export default function validate(fields: JSX.Element[], values: any = {}) {
  return validateImpl(fields, values);
}
