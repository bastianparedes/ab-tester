import { describe, expect, it } from 'vitest';
import { extendPathURL } from './url';

describe('extendPathURL', () => {
  it.each([
    { base: 'https://example.com', extraPath: 'campaigns', pathname: '/campaigns' },
    { base: 'https://example.com/base', extraPath: 'campaigns', pathname: '/base/campaigns' },
    { base: 'https://example.com/base/', extraPath: 'campaigns', pathname: '/base/campaigns' },
    { base: 'https://example.com/base', extraPath: '/campaigns', pathname: '/base/campaigns' },
    { base: 'https://example.com/base/', extraPath: '/campaigns', pathname: '/base/campaigns' },
    { base: 'https://example.com/base', extraPath: '', pathname: '/base/' },
    { base: 'https://example.com/base?mode=debug#section', extraPath: 'campaigns', pathname: '/base/campaigns' },
  ])('appends "$extraPath" to "$base"', ({ base, extraPath, pathname }) => {
    const result = extendPathURL(new URL(base), extraPath);

    expect(result).toBeInstanceOf(URL);
    expect(result.pathname).toBe(pathname);
  });

  it('does not mutate the input URL', () => {
    const base = new URL('https://example.com/base/');

    extendPathURL(base, '/campaigns');

    expect(base.href).toBe('https://example.com/base/');
  });
});
