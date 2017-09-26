
import {
  TestClass
} from '@hn3000/tsunit-async'

import { Template, TemplateFactory, makePattern } from '../src/template';

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
  testTemplateRendersDynamicTextWithPatternConfig() {
    let text = 'XX${who}ZZ';
    let pattern = '${X}';
    let template = new Template(text, null, { pattern });
    this.areIdentical(
      text.replace(/\$\{who}/, 'someone'),
      template.render({who: 'someone'})
    );
    this.areIdentical(
      'XXsometwoZZ',
      template.render({who: 'sometwo'})
    );
    this.areIdentical(
      text.replace(/\$\{who}/, 'somethree'),
      template.render({who: 'somethree'})
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
  testTemplateRendersDynamicTextWithDefaults() {
    let text = '{{who}}';
    let template = new Template(text, {who: 'world'});
    this.areIdentical(
      text.replace(/{{who}}/, 'world'),
      template.render({})
    );
    this.areIdentical(
      text.replace(/\{\{who}}/, 'TypeScript'),
      template.render({who: 'TypeScript'})
    );
  }


  testTemplateFactoryCreatesTemplates() {
    let pattern = /((?:.|\r|\n)*?)-->(.*?)<--/gm;
    const factory = new TemplateFactory({pattern, defaults: { who: 'someone' }});

    let text = '---->who<----';
    let template = factory.parse(text);
    this.areIdentical(
      text.replace(/-->who<--/, 'someone'),
      template.render({})
    );
    this.areIdentical(
      text.replace(/-->who<--/, 'sometwo'),
      template.render({ who: 'sometwo' })
    );
    template = factory.parse(text, {who: 'somethree'})
    this.areIdentical(
      text.replace(/-->who<--/, 'somethree'),
      template.render({})
    );
  }


  testMakePatternAcceptsSplitPattern() {
    let re = makePattern('%%#%%', '#');
    let m = re.exec('**%%++%%**');
    this.areIdentical(3, m.length, `expected 3 groups, got: ${m}`);
    this.areIdentical('**%%++%%', m[0]);
    this.areIdentical('**', m[1]);
    this.areIdentical('++', m[2]);
  }
}
