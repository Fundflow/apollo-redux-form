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

    if ( isRequired && _.isNil(value) ) {
      errors[ fieldName ] = 'Required field.';
    } else {
      if ( children && children.length > 0 ) {
        // don't do nesting if no value is defined
        if ( !_.isNil(value) ) {
          const result = validateImpl(children, value);
          // got some errors, attach them to parent
          if (!_.isEmpty(result)) {
            errors[ fieldName ] = result;
          }
        }
      }
    }

  });
  return errors;
}

export default function validate(fields: JSX.Element[], values: any = {}) {
  return validateImpl(fields, values);
}
