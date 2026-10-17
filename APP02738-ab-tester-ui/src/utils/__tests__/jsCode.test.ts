import { describe, expect, it } from 'vitest';
import { jsCodeHasCorrectSyntax, jsCodeIsSingleAsyncArrowFunction } from '../jsCode';

describe('jsCodeHasCorrectSyntax', () => {
  it('accepts valid statements and top-level await', () => {
    expect(jsCodeHasCorrectSyntax('const answer = 42;')).toBe(true);
    expect(jsCodeHasCorrectSyntax('const answer = await Promise.resolve(42);')).toBe(true);
  });

  it('rejects incomplete JavaScript', () => {
    expect(jsCodeHasCorrectSyntax('if (')).toBe(false);
  });
});

describe('jsCodeIsSingleAsyncArrowFunction', () => {
  it.each(['async () => { return 42; }', 'async value => value + 1', '(async (value = 1) => value)'])('accepts a single async arrow: %s', (code) => {
    expect(jsCodeIsSingleAsyncArrowFunction(code)).toBe(true);
  });

  it.each([
    'async /* parameter comment */ value => value',
    'async /* parameter comment */ (value) => await Promise.resolve(value)',
    'async /* => */ () => true',
    'async (value) /* ) */ => value',
    '((async () => ({ value: true })))',
    'async () => { if (true) { await Promise.resolve(); } return true; }',
    'async (...args) => args.length',
  ])('accepts nested parameters, comments and block bodies: %s', (code) => {
    expect(jsCodeIsSingleAsyncArrowFunction(code)).toBe(true);
  });

  it.each(['', '() => 42', 'async function () {}', 'async () => {}\nconst extra = 1', 'async () => {'])('rejects non-single or invalid functions: %s', (code) => {
    expect(jsCodeIsSingleAsyncArrowFunction(code)).toBe(false);
  });

  it('rejects a valid synchronous arrow expression', () => {
    expect(jsCodeIsSingleAsyncArrowFunction('value => value')).toBe(false);
    expect(jsCodeIsSingleAsyncArrowFunction('async => value')).toBe(false);
    expect(jsCodeIsSingleAsyncArrowFunction('value /* ; */')).toBe(false);
  });

  it.each(['async /* unterminated', 'async (value,,) => value', 'async () => { /* unterminated'])('rejects invalid parameter/trivia forms: %s', (code) => {
    expect(jsCodeIsSingleAsyncArrowFunction(code)).toBe(false);
  });

  it('allows a trailing semicolon and comments', () => {
    expect(jsCodeIsSingleAsyncArrowFunction('async () => 42; // trailing comment')).toBe(true);
  });

  it.each([
    '/* leading */ async /* parameter */ value => await Promise.resolve(value)',
    'async (value = 1, ...rest) => ({ value, rest })',
    'async (value = build()) => value',
    'async (callback = () => true) => callback',
    '(async () => { const nested = () => 1; return nested(); })',
    'async () => { if (true) { return 1; } return 0; } /* trailing */',
    'async () => { return true; } /* } */',
    'async () => 42; /* trailing semicolon comment */',
  ])('accepts valid async arrow syntax with trivia and nested expressions: %s', (code) => {
    expect(jsCodeIsSingleAsyncArrowFunction(code)).toBe(true);
  });

  it.each(['async', 'async (value = ) => value', 'async () => {} extra', 'async () => { /* unclosed', 'async () => {}\nconst second = async () => true'])(
    'rejects malformed or multiple async expressions: %s',
    (code) => {
      expect(jsCodeIsSingleAsyncArrowFunction(code)).toBe(false);
    },
  );
});
