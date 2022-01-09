
const HTML = {
  _createElement(name, ...args) {
    const result = document.createElement(name);
    args.forEach(x => {
      if (typeof x === 'string') {
        result.appendChild(document.createTextNode(x));
      } else if (x instanceof Node) {
        result.appendChild(x);
      } else if (typeof x === 'object') {
        Object.keys(x).forEach(k => {
          if (typeof x[k] === 'function') {
            const name = k.startsWith('on') ? k.substr(2) : k;
            result.addEventListener(name, x[k]);
          } else {
            result.setAttribute(k, x[k]);
          }
        });
      }
    });
    return result;
  }
};

"div|span|p|input|form|button".split('|').forEach(e => HTML[e] = HTML._createElement.bind(HTML, e));

