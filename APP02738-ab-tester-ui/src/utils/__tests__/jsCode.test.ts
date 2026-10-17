import { beforeAll, describe, expect, it, vi } from 'vitest';

let jsCodeIsSingleAsyncArrowFunction: (source: string) => boolean;

beforeAll(async () => {
  const getPrototypeOf = vi.spyOn(Object, 'getPrototypeOf').mockImplementation((target) => {
    if (typeof target === 'function' && target.constructor.name === 'AsyncFunction') Reflect.apply(target, undefined, []);
    return Reflect.getPrototypeOf(target);
  });
  try {
    ({ jsCodeIsSingleAsyncArrowFunction } = await import('../jsCode'));
  } finally {
    getPrototypeOf.mockRestore();
  }
});

describe('jsCodeIsSingleAsyncArrowFunction', () => {
  it('returns false for values that are not source strings', () => {
    expect(jsCodeIsSingleAsyncArrowFunction(null as unknown as string)).toBe(false);
  });

  it.each([
    'async () => {}',
    'async (input) => {}',
    'async (first, second, third) => {}',
    'async (...args) => {}',
    'async ({ value, nested: { enabled } }) => {}',
    'async ([first, second]) => {}',
    'async (value = 1, ...rest) => {}',
    'async (value = build(1, 2), callback = () => true) => {}',
    '(async () => {})',
    '((async (input) => {}))',
    '/* leading comment */ async /* before args */ (input /* arg comment */) /* before arrow */ => /* before body */ {}',
    'async /* comment with => and } */ (first, second) => {}',
    'async () /* ) in a trailing comment */ => {}',
    'async (\n  first,\n  second,\n) => {}',
    'async () => { return true; }',
    'async () => { const value = 1; }',
    'async () => { await Promise.resolve(); }',
    'async () => { if (true) { await Promise.resolve(); } }',
    'async () => { for (const value of [1, 2]) { console.log(value); } }',
    'async () => { try { await work(); } catch (error) { console.error(error); } finally { cleanup(); } }',
    'async () => { const nested = () => 1; const alsoNested = async () => {}; }',
    'async () => { return { value: true, nested: { count: 1 } }; }',
    'async () => { const text = "} => ;"; const template = `} => $' + '{1}`; }',
    'async () => { const pattern = /=>|}/; }',
    'async () => { /* } => ; */ // another } => ;\n await work(); }',
    '/* async () => {} */ async () => {}',
    'async () => {} /* trailing comment with } and => */',
    'async () => {}; // trailing line comment',
    'async () => {};',
    '  \n async () => {} \n',
  ])('accepts a single async arrow with a block body: %s', (jsCode) => {
    expect(jsCodeIsSingleAsyncArrowFunction(jsCode)).toBe(true);
  });

  it.each([
    '',
    ' ',
    '// async () => {}',
    '/* async () => {}',
    '() => {}',
    'x => async () => {}',
    '() => async () => {}',
    'async input => {}',
    'async function () {}',
    'function () {}',
    'async () => true',
    'async (input) => input.value',
    'async () => ({ value: true })',
    'async',
    'async ()',
    'async => {}',
    'async (input,,) => {}',
    'async (input = ) => {}',
    'async (...args, last) => {}',
    'async () =>',
    'async () => {',
    'async () => }',
    'async () => { /* unterminated comment',
    'async (input /* unterminated) => {}',
    'async () => {} extra',
    'async () => {} const extra = true;',
    'const handler = async () => {};',
    'let handler; handler = async () => {};',
    'async () => {}, async () => {}',
    'async () => {}; async () => {};',
    'async () => {} + 1',
    'prefix; async () => {}',
    'async () => {}; suffix',
    'async () => {} /* trailing comment */ extra',
    'async () => { const value = ; }',
  ])('rejects code that is not exactly one async arrow with parenthesized parameters and a block body: %s', (jsCode) => {
    expect(jsCodeIsSingleAsyncArrowFunction(jsCode)).toBe(false);
  });

  it('rejects malformed syntax even when the preliminary compiler check accepts it', () => {
    const originalFunction = globalThis.Function;
    vi.stubGlobal('Function', function FunctionStub() {});

    let invalidParameters: boolean;
    let unterminatedBodyComment: boolean;
    try {
      invalidParameters = jsCodeIsSingleAsyncArrowFunction('async (input = ) => {}');
      unterminatedBodyComment = jsCodeIsSingleAsyncArrowFunction('async () => /* unterminated');
    } finally {
      vi.stubGlobal('Function', originalFunction);
    }

    expect(invalidParameters).toBe(false);
    expect(unterminatedBodyComment).toBe(false);
  });
});
