
export type TEventHandler = 
  | ((this: HTMLElement, ev: Event) => boolean)

export type TAttributes = {
  [a: string]: string|TEventHandler;
}

export interface IHTMLFactory {
  [name: string]: (...args: (string|Node|TAttributes)[]) => HTMLElement;
  _createElement(name: string, ...args: (string|Node|TAttributes)[]): HTMLElement;
}

export const HTML: IHTMLFactory = {
  _createElement(name: string, ...args: (string|Node|TAttributes)[]) {
    const result = document.createElement(name);
    args.forEach(x => {
      if (typeof x === 'string' || x instanceof Node) {
        result.append(x);
      } else if (typeof x === 'object') {
        Object.keys(x).forEach(k => {
          if (typeof x[k] === 'function') {
            const name = k.startsWith('on') ? k.substring(2) : k;
            const handler = x[k] as TEventHandler;
            result.addEventListener(name, handler);
          } else {
            result.setAttribute(k, x[k] as string);
          }
        });
      }
    });
    return result;
  }
};

"div|span|p|input|form|button".split('|').forEach(e => HTML[e] = HTML._createElement.bind(HTML, e));

function toKebabCase(maybeCamel: string) {
  
}