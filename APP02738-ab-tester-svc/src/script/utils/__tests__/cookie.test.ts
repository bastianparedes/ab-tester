import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import cookie from '../cookie';

describe('cookie', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { cookie: '' });
    vi.stubGlobal('window', { location: { hostname: 'example.test' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads and decodes a named cookie', () => {
    document.cookie = 'session=active; greeting=hello%20world';

    expect(cookie.get({ name: 'greeting' })).toBe('hello world');
  });

  it('returns null when the cookie is missing', () => {
    document.cookie = 'session=active';

    expect(cookie.get({ name: 'missing' })).toBeNull();
  });

  it('sets cookies using the default path and current hostname', () => {
    cookie.set({ exdays: 2, name: 'theme', value: 'dark' });

    expect(document.cookie).toMatch(/^theme=dark;expires=.+;path=\/;domain=example\.test$/);
  });

  it('uses a supplied path and domain', () => {
    cookie.set({ domain: 'example.org', exdays: 1, name: 'theme', path: '/app', value: 'light' });

    expect(document.cookie).toMatch(/^theme=light;expires=.+;path=\/app;domain=example\.org$/);
  });

  it('removes a cookie by setting an empty value with a negative lifetime', () => {
    cookie.remove({ name: 'session' });

    expect(document.cookie).toMatch(/^session=;expires=.+;path=\/;domain=example\.test$/);
  });
});
