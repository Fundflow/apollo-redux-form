/// <reference types="react" />
import * as React from 'react';
import { DocumentNode } from 'graphql';
import { MutationOpts, QueryProps } from 'react-apollo';
import { ConfigProps } from 'redux-form';
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
export interface Fields {
    length: number;
    forEach(callback: (name: string, index: number, fields: Fields) => void): void;
    get(index: number): any;
    getAll(): any[];
    insert(index: number, value: any): void;
    map(callback: (name: string, index: number, fields: Fields) => any): any;
    pop(): any;
    push(value: any): void;
    remove(index: number): void;
    shift(): any;
    swap(indexA: number, indexB: number): void;
    unshift(value: any): void;
}
export interface ArrayFieldProps {
    fields: Fields;
    meta: {
        touched: boolean;
        error: string;
        warning: string;
    };
    [prop: string]: any;
}
export declare type ApolloReduxFormOptions = Partial<ConfigProps> & MutationOpts & {
    customFields?: FormFieldRenderers;
    renderers?: FormFieldRenderers;
    schema?: DocumentNode;
    renderForm?: (fields: any, props: FormProps) => JSX.Element;
};
export declare const isScalar: (name: string) => boolean;
export declare function buildForm(document: DocumentNode, options?: ApolloReduxFormOptions): any;
export declare type InitFormOptions = (Object | ((props: any) => QueryProps)) & {
    mapToForm?: (values: any) => any;
    [key: string]: any;
};
export declare const initForm: (document: DocumentNode, options: InitFormOptions) => any;
export declare function apolloForm(document: DocumentNode, options?: ApolloReduxFormOptions): React.ComponentClass<any>;
