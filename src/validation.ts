import * as React from 'react';

export default function validate(fields: JSX.Element[], values: any = {}) {
  const errors: any = {};
  fields.forEach( (field: JSX.Element) => {
    const fieldName = field.props.name;
    const value = values[fieldName];
      if (field.props.required) {
        if ( !value ) {
          errors[ fieldName ] = 'Required field.';
        }
      }
  });
  return errors;
}
