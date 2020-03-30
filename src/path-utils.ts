
export function combinePaths(...paths: string[]) {
  return paths.reduce(combine2Paths);
}

export function combine2Paths(a: string, b: string) {
  const aHasSlash = a.endsWith('/');
  const bHasSlash = b.startsWith('/');
  if (aHasSlash !== bHasSlash) {
    return a+b;
  } else if (aHasSlash) {
    return a + b.substr(1);
  } else {
    return a + '/' + b;
  }
}
