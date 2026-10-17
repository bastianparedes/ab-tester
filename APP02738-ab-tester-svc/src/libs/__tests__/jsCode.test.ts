import { describe, expect, it } from 'vitest';
import { jsCodeHasCorrectSyntax, jsCodeIsSingleAsyncArrowFunction } from '../jsCode';

describe('jsCodeHasCorrectSyntax', () => {
  it.each(['const value = 1;', 'await Promise.resolve();', ''])('accepts syntactically valid code: %s', (jsCode) => {
    expect(jsCodeHasCorrectSyntax(jsCode)).toBe(true);
  });

  it.each(['const = 1;', 'if (true) {'])('rejects invalid syntax: %s', (jsCode) => {
    expect(jsCodeHasCorrectSyntax(jsCode)).toBe(false);
  });
});

describe('jsCodeIsSingleAsyncArrowFunction', () => {
  it.each([
    'async () => { return true; }',
    'async input => input.value',
    'async (input) => input.value',
    '(async () => { await Promise.resolve(); })',
    '/* handler */ async /* arguments */ (input) => { return input; };',
  ])('accepts a single async arrow function: %s', (jsCode) => {
    expect(jsCodeIsSingleAsyncArrowFunction(jsCode)).toBe(true);
  });

  it.each([
    '() => true',
    'async function () { return true; }',
    'async () => {}; const extra = true;',
    'async (input,,) => input',
    'async () => {',
  ])('rejects code that is not a single valid async arrow function: %s', (jsCode) => {
    expect(jsCodeIsSingleAsyncArrowFunction(jsCode)).toBe(false);
  });
});
