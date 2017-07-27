/// <reference types="react" />
import { BaseFieldProps } from 'redux-form';
import { FieldProps } from './apolloForm';
export declare type FormFieldRenderFunction = (props: FieldProps) => JSX.Element;
export declare type FormFieldRenderer = {
    render: FormFieldRenderFunction;
} & BaseFieldProps;
export interface FormFieldRenderers {
    [key: string]: FormFieldRenderFunction | FormFieldRenderer;
}
export interface SelectOption {
    key: string;
    value: string;
}
export declare class FormBuilder {
    createInputField(renderer: FormFieldRenderer, name: string, type: string, required?: boolean): JSX.Element;
    createFormSection(name: string, children: JSX.Element[], required?: boolean): JSX.Element;
    createSelectField(renderer: FormFieldRenderer, name: string, type: string, options: SelectOption[], required?: boolean): JSX.Element;
}
