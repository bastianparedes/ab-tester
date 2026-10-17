import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import cookie from '../cookie';

describe('cookie', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { location: { hostname: 'example.test' } });
    vi.stubGlobal('document', { cookie: 'session=abc123; displayName=Ana%20Maria' });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('gets and decodes a named cookie', () => {
    expect(cookie.get({ name: 'session' })).toBe('abc123');
    expect(cookie.get({ name: 'displayName' })).toBe('Ana Maria');
  });

  it('returns null when the cookie is absent', () => {
    expect(cookie.get({ name: 'missing' })).toBeNull();
  });

  it('sets expiry, path, and the default domain', () => {
    cookie.set({ exdays: 2, name: 'session', value: 'fresh' });

    expect(document.cookie).toBe('session=fresh;expires=Sat, 03 Jan 2026 00:00:00 GMT;path=/;domain=example.test');
  });

  it('expires a cookie when removing it', () => {
    cookie.remove({ name: 'session' });

    expect(document.cookie).toBe('session=;expires=Wed, 31 Dec 2025 00:00:00 GMT;path=/;domain=example.test');
  });
});
