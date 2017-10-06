// XXX override type definitions for FormSection
// we should make a PR against the original repo since the API allows arbitrary props in FormSection
// see http://redux-form.com/7.0.1/docs/api/FormSection.md/
import { FormSection } from 'redux-form';
import { Component, ComponentType } from "react";

declare module 'redux-form' {

  export interface FormSectionProps<P = {}> {
    name: string;
    component?: string | ComponentType<P>;
    [others: string]: any;
  }

  export class FormSection extends Component<FormSectionProps> {}
}
