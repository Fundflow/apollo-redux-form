// tslint:disable-next-line
const _ = require('lodash');

function validateImpl(
  fields: JSX.Element[],
  values: any = {},
) {
  const errors: any = Object.create(null);
  fields.forEach( (field: JSX.Element) => {
    const fieldName = field.props.name;
    const children = field.props.children;
    const isRequired = field.props.required;
    const value = values[fieldName];

    if ( isRequired && ( _.isEmpty(value) || _.isNil(value) )) {
      errors[ fieldName ] = 'Required field.';
    } else {
      if ( children && children.length > 0 ) {
        const result = validateImpl(children, value);
        if (!_.isEmpty(result)) {
          errors[ fieldName ] = result;
        }
      }
    }

  });
  return errors;
}

export default function validate(fields: JSX.Element[], values: any = {}) {
  return validateImpl(fields, values);
}
