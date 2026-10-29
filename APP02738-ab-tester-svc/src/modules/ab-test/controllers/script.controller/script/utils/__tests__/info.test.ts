import { afterEach, describe, expect, it, vi } from 'vitest';
import cookie from '../cookie';
import { getId } from '../info';

describe('getId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reuses a saved numeric identifier', () => {
    vi.spyOn(cookie, 'get').mockReturnValue('42');
    const setCookie = vi.spyOn(cookie, 'set').mockImplementation(() => {});

    expect(getId()).toBe(42);
    expect(setCookie).toHaveBeenCalledWith({
      exdays: expect.any(Number),
      name: expect.any(String),
      value: 42,
    });
  });
});
