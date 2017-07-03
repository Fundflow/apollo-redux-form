/// <reference types="react" />
import { BaseFieldProps } from '@types/redux-form/lib/Field';
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
    createFormSection(name: string, children: JSX.Element[]): JSX.Element;
    createSelectField(renderer: FormFieldRenderer, name: string, type: string, options: SelectOption[], required?: boolean): JSX.Element;
}
