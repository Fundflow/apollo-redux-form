// XXX override type definitions for FormSection
// we should make a PR against the original repo since the API allows arbitrary props in FormSection
// see http://redux-form.com/7.0.1/docs/api/FormSection.md/
import { FormSection } from 'redux-form';
import { Component } from "react";

declare module 'redux-form' {

  interface FormSectionProps {
    name: string;
    component?: string | Component<any, any>;
    [others: string]: any;
  }

  export class FormSection extends Component<FormSectionProps, any> {}
}
