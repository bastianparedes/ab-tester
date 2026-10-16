import { afterEach, describe, expect, it, vi } from 'vitest';
import queryParam from './queryParam';

describe('queryParam.get', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a query parameter value', () => {
    vi.stubGlobal('location', { search: '?variant=blue&source=email' });

    expect(queryParam.get('source')).toBe('email');
  });

  it('returns an empty string for a present parameter without a value', () => {
    vi.stubGlobal('location', { search: '?enabled&variant=blue' });

    expect(queryParam.get('enabled')).toBe('');
  });

  it('returns null for a missing parameter', () => {
    vi.stubGlobal('location', { search: '?variant=blue' });

    expect(queryParam.get('source')).toBeNull();
  });
});
