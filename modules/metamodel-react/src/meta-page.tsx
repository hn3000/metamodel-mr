
import * as React from 'react';
import { Requireable } from 'prop-types';

import { IPageProps, IFormContext } from './api';
import { MetaContextFollower } from './base-components';
import { MetaForm } from './meta-form';

import { propsDifferent } from './props-different';
import { IPropertyStatusMessage, MessageSeverity } from '@hn3000/metamodel';

export class MetaPage extends MetaContextFollower<IPageProps, any> {

  static contextTypes = MetaForm.childContextTypes;

  constructor(props:IPageProps, context:any) {
    super(props, context);
  }

  private _skipped = 0;

  shouldComponentUpdate(nextProps: IPageProps, nextState: any, nextContext: any): boolean {
    let formContext = this.formContext;
    let nextFormContext = nextContext.formContext;
    let result =  (
        !this.state
        || this.props.page === this.state.currentPage
        || this.props.alias === this.state.currentPageAlias
        || nextProps.page === nextState.currentPage
        || nextProps.alias === nextState.currentPageAlias
      ) && (
        true // super.shouldComponentUpdate(nextProps, nextState, nextContext)
      );
    if (result) {
      this._skipped = 0;
    } else {
      ++this._skipped;
    }

    //console.log(`page scu: ${nextProps.page} ${result} (skipped ${this._skipped})`);
    return result;
  }

  protected _extractState(context:IFormContext): any {
    var newState = {
      currentPage: context.currentPage,
      currentPageAlias: context.currentPageAlias,
      //viewmodel: context.viewmodel
    } as any;
    return newState;
  }


  render() {
    let context = this.formContext;

    let { page, alias, contents } = this.props;

    const isCurrentPage = (
      (null != page && page === context.currentPage)
      || (null != alias && alias === context.currentPageAlias)
    )

    if (isCurrentPage) {
      const pageAlias = context.currentPageAlias;
      const Wrapper = context.config.findPageWrapper(pageAlias);
      const Page = context.config.findPage(pageAlias);

      //console.log(`rendering page ${this.props.page}`);
      const hasErrors = !context.isValid();
      const messages = context.viewmodel.getStatusMessages();
      const errors = messages.filter(x => x.severity == MessageSeverity.ERROR && 'property' in x) as IPropertyStatusMessage[];
  
      const metamodel = context.metamodel;
      const schema = metamodel.propGet('schema');
      const modelId = (schema && schema.modelId) || metamodel.name;

      const wrapperProps = {
        id: modelId,
        pageAlias,
        busy: context.isBusy(),
        context,
        hasErrors,
        messages,
        errors
      }

      if (null == contents && null == Page) {
        return <Wrapper {...wrapperProps}>{this.props.children}</Wrapper>;
      } else if (null != Page) {
        if (0 != React.Children.count(this.props.children) || null != contents) {
          console.log(`warning: MetaPage ignores children and contents (${this.props.contents}) if a page is configured (${pageAlias})`);
        }
        return <Wrapper {...wrapperProps}><Page {...wrapperProps}/></Wrapper>;
      } else {
        if (0 != React.Children.count(this.props.children)) {
          console.log(`warning: MetaPage ignores children if contents (${this.props.contents}) is specified`);
        }
        const Contents = this.props.contents;
        return <Wrapper {...wrapperProps}><Contents /></Wrapper>;
      }
    }
    //console.log(`not rendering page ${page || alias}, we're on ${context.currentPage} / ${context.currentPageAlias}`);
    return null;
  }
}

