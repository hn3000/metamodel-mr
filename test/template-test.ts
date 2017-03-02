
import {
  TestClass
} from '@hn3000/tsunit-async'

import { Template } from '../src/template';

export class TemplateTest extends TestClass {
  testTemplateRendersStaticText() {
    let text = 'some text (with braces: { })';
    let template = new Template(text);
    this.areIdentical(text, template.render(null));
  }
  testTemplateRendersDynamicText() {
    let text = '{{who}}';
    let template = new Template(text);
    this.areIdentical(
      text.replace(/{{who}}/, 'world'), 
      template.render({who: 'world'})
    );
    this.areIdentical(
      text.replace(/\{\{who}}/, 'TypeScript'), 
      template.render({who: 'TypeScript'})
    );
  }
  testTemplateRendersMixedDynamicText() {
    let text = 'Hello {{who}}! I hope you are {{what}}.';
    let template = new Template(text);
    this.areIdentical(
      text.replace(/\{\{who}}/, 'world'), 
      template.render({who: 'world'})
    );
    template.setDefaults({what: 'fine'});
    this.areIdentical(
      text.replace(/\{\{who}}/, 'world').replace(/\{{what}}/, 'fine'), 
      template.render({who: 'world'})
    );
    this.areIdentical(
      text.replace(/\{\{who}}/, 'TypeScript').replace(/\{{what}}/, 'type safe'), 
      template.render({who: 'TypeScript', what: 'type safe'})
    );
  }
}
