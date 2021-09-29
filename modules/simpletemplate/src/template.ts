
var defaultPattern = makePattern('{{X}}');

function echoValue(k:string, a:any, b:any) {
  return k;
}
function selectValue(k:string, a:any, b:any) {
  var av = a[k];
  if (null != av) return av;
  var av = b[k];
  if (null != av) return av;
  return '{{'+k+'}}';
}

export interface ITemplateConfig {
  defaults?: any;
  pattern: string|RegExp;
}

interface ITemplateSettings {
  defaults?: any;
  pattern: RegExp;
}

export class TemplateFactory {
  constructor(config?: ITemplateConfig) {
    this._config = config;
  }

  parse(template: string, defaults:any = this._config.defaults): Template {
    return new Template(template, defaults, { ...this._config });
  }

  private _config: ITemplateConfig;
}

export class Template {
  private _parts:((a:any,b:any)=>string)[];
  private _config: ITemplateSettings;
  constructor(templateString:string, defaults?: any, config?:ITemplateConfig) {

    this._config = { pattern: defaultPattern, defaults: { } };
    if (null != config) {
      let pattern = makePattern(config.pattern);
      this._config = { ...this._config, ...config, pattern };
    }
    if (null != defaults) {
      this._config = { ... this._config, defaults };
    }

    var parts = [];
    var end = 0;
    var m = null;

    let { pattern } = this._config;
    while (null != (m = pattern.exec(templateString))) {
      if (m[1]) {
        parts.push(echoValue.bind(null, m[1]));
      }
      const sel = selectValue.bind(null, m[2]);
      sel.variable = m[2];
      parts.push(sel);
      end = pattern.lastIndex;
    }
    if (end < templateString.length) {
      parts.push(echoValue.bind(null, templateString.substring(end)));
    }

    this._parts = parts;
  }

  render(values:any) {
    var defaults = this._config.defaults;
    var str = this._parts.map((x)=>x(values, defaults));
    return str.join('');
  }

  setDefaults(defaults: any) {
    this._config = { ...this._config, defaults}
  }

  getNames(): string[] {
    return this._parts.map((x:any) => x['variable']).filter(x => !!x);
  }
}

function Q(x: string) {
  return x.replace(/[\^\$\[\]]/gm, (f)=>'\\'+f);
}

export function makePattern(pattern: string|RegExp, splitPoint: string = 'X'): RegExp {
  if ('string' === typeof pattern) {
    let patternParts = pattern.split(splitPoint);
    let reTEXT = [
      '((?:.|\r|\n)*?)', Q(patternParts[0]), '(.*?)', Q(patternParts[1])
    ].join('');

    return new RegExp(reTEXT, 'gm');
  }
  return pattern;
}
