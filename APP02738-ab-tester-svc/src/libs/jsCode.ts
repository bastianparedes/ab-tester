export const jsCodeHasCorrectSyntax = (jsCode: string) => {
  try {
    new Function(`return (async () => { ${jsCode} })`);
    return true;
  } catch {
    return false;
  }
};

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as FunctionConstructor;

const canCompile = (jsCode: string, asynchronous = false): boolean => {
  try {
    const Constructor = asynchronous ? AsyncFunction : Function;
    new Constructor(jsCode);
    return true;
  } catch {
    return false;
  }
};

const skipTrivia = (source: string, start: number): number => {
  let position = start;
  while (position < source.length) {
    if (/\s/u.test(source[position])) {
      position++;
    } else if (source.startsWith('//', position)) {
      position += 2;
      while (position < source.length && !/[\r\n\u2028\u2029]/u.test(source[position])) position++;
    } else if (source.startsWith('/*', position)) {
      const end = source.indexOf('*/', position + 2);
      if (end === -1) return -1;
      position = end + 2;
    } else {
      break;
    }
  }
  return position;
};

const hasValidArrowParameters = (header: string): boolean => {
  if (!header.startsWith('async')) return false;
  const start = skipTrivia(header, 5);
  if (start === -1 || (start === 5 && header[start] !== '(')) return false;
  if (!canCompile(`return (${header} => {});`)) return false;

  if (header[start] !== '(') {
    try {
      new AsyncFunction(header.slice(start), '');
      return true;
    } catch {
      return false;
    }
  }

  for (let end = header.lastIndexOf(')'); end > start; end = header.lastIndexOf(')', end - 1)) {
    if (skipTrivia(header, end + 1) !== header.length) continue;
    try {
      new AsyncFunction(header.slice(start + 1, end), '');
      return true;
    } catch {}
  }
  return false;
};

const isSingleAsyncArrowExpression = (source: string): boolean => {
  if (!canCompile(`return (\n${source}\n);`)) return false;
  const start = skipTrivia(source, 0);
  if (start === -1 || start === source.length) return false;

  if (source[start] === '(') {
    for (let end = source.lastIndexOf(')'); end > start; end = source.lastIndexOf(')', end - 1)) {
      if (skipTrivia(source, end + 1) === source.length && isSingleAsyncArrowExpression(source.slice(start + 1, end))) return true;
    }
    return false;
  }

  for (let arrow = source.indexOf('=>', start); arrow !== -1; arrow = source.indexOf('=>', arrow + 2)) {
    if (!hasValidArrowParameters(source.slice(start, arrow))) continue;
    const bodyStart = skipTrivia(source, arrow + 2);
    if (bodyStart === -1) return false;

    if (source[bodyStart] !== '{') {
      return canCompile(`return true ? ${source.slice(bodyStart)}\n : null;`, true);
    }

    for (let end = source.lastIndexOf('}'); end > bodyStart; end = source.lastIndexOf('}', end - 1)) {
      if (skipTrivia(source, end + 1) === source.length && canCompile(source.slice(bodyStart + 1, end), true)) return true;
    }
    return false;
  }
  return false;
};

export const jsCodeIsSingleAsyncArrowFunction = (jsCode: string): boolean => {
  try {
    if (isSingleAsyncArrowExpression(jsCode)) return true;
    for (let end = jsCode.lastIndexOf(';'); end !== -1; end = jsCode.lastIndexOf(';', end - 1)) {
      if (skipTrivia(jsCode, end + 1) === jsCode.length && isSingleAsyncArrowExpression(jsCode.slice(0, end))) return true;
      if (end === 0) break;
    }
    return false;
  } catch {
    return false;
  }
};
