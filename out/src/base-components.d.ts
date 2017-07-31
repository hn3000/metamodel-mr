/// <reference types="react" />
import * as React from 'react';
import * as PropTypes from 'prop-types';
export { Requireable } from 'prop-types';
import { IFormContext, IMetaFormBaseProps } from './api';
import { MetaFormContext } from './form-context';
export interface IMetaFormBaseState {
    currentPage?: number;
}
export declare var MetaForm_ContextTypes: {
    isRequired: () => boolean;
    formContext: PropTypes.Requireable<any>;
};
export declare abstract class MetaContextAware<P extends IMetaFormBaseProps, S> extends React.Component<P, S> {
    static contextTypes: {
        isRequired: () => boolean;
        formContext: PropTypes.Requireable<any>;
    };
    constructor(props: P, context?: MetaFormContext);
    readonly formContext: IFormContext;
}
export declare class MetaContextAwarePure<P, S> extends MetaContextAware<P, S> {
    shouldComponentUpdate(nextProps: P, nextState: S, nextContext: any): boolean;
}
export declare abstract class MetaContextFollower<P extends IMetaFormBaseProps, S> extends MetaContextAware<P, S> {
    static contextTypes: {
        isRequired: () => boolean;
        formContext: PropTypes.Requireable<any>;
    };
    constructor(props: P, context?: MetaFormContext);
    protected initialContext(context: IFormContext): void;
    protected _extractState(context: IFormContext): S;
    private _updatedContext(context, initState?);
    componentDidMount(): void;
    componentWillUnmount(): void;
    private _unsubscribe;
}
