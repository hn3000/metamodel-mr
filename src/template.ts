
var itemRE = /((?:.|\r|\n)*?)\{{(.*?)}}/gm;

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

export class Template {
  private _parts:((a:any,b:any)=>string)[];
  private _defaults:any;
  constructor(templateString:string, defaults?:any) {
    var parts = [];
    var end = 0;
    var m = null;
    while (null != (m = itemRE.exec(templateString))) {
      if (m[1]) {
        parts.push(echoValue.bind(null, m[1]));
      }
      parts.push(selectValue.bind(null, m[2]));
      end = itemRE.lastIndex;
    }
    if (end < templateString.length) {
      parts.push(echoValue.bind(null, templateString.substring(end)));
    }

    this._parts = parts;
    this._defaults = defaults || {};
  }

  render(values:any) {
    var defaults = this._defaults;
    var str = this._parts.map((x)=>x(values, defaults));
    return str.join('');
  }

  setDefaults(defaultValues:any) {
    this._defaults = defaultValues;
  }
}

