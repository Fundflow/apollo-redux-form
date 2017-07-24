/// <reference types="react" />
import * as React from 'react';
import { DocumentNode } from 'graphql';
import { MutationOptions, QueryOptions } from 'react-apollo/lib/graphql';
import { Config } from 'redux-form';
import { FormFieldRenderers } from './render';
export declare type OperationTypeNode = 'query' | 'mutation';
export interface FormProps {
    handleSubmit: any;
    fields: any;
    pristine: boolean;
    submitting: boolean;
    invalid: boolean;
}
export interface FieldProps {
    input: any;
    label: string;
    meta: {
        touched: boolean;
        error: string;
        warning: string;
    };
    [prop: string]: any;
}
export declare type ApolloReduxFormOptions = Config<any, any, any> & MutationOptions & {
    renderers?: FormFieldRenderers;
    schema?: DocumentNode;
    renderForm?: (fields: any, props: FormProps) => JSX.Element;
};
export declare const isScalar: (name: string) => boolean;
export declare function buildForm(document: DocumentNode, options?: ApolloReduxFormOptions): any;
export declare type InitFormOptions = (Object | ((props: any) => QueryOptions)) & {
    mapToForm?: (values: any) => any;
    [key: string]: any;
};
export declare const initForm: (document: DocumentNode, options: InitFormOptions) => any;
export declare function apolloForm(document: DocumentNode, options?: ApolloReduxFormOptions): React.ComponentClass<any>;
