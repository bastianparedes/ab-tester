// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionStorage } from '../useSessionStorage';

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('useSessionStorage', () => {
  it('uses and persists the initial value when storage is empty', () => {
    const { result } = renderHook(() => useSessionStorage('settings', { enabled: true }));

    expect(result.current[0]).toEqual({ enabled: true });
    expect(window.sessionStorage.getItem('settings')).toBe('{"enabled":true}');
  });

  it('reads a previously stored value and persists updates', () => {
    window.sessionStorage.setItem('count', '2');
    const { result } = renderHook(() => useSessionStorage('count', 0));

    expect(result.current[0]).toBe(2);

    act(() => result.current[1](3));

    expect(window.sessionStorage.getItem('count')).toBe('3');
  });

  it('removes the stored value when updated to null', () => {
    window.sessionStorage.setItem('optional', '"value"');
    const { result } = renderHook(() => useSessionStorage<string | null>('optional', null));

    act(() => result.current[1]('value'));
    expect(window.sessionStorage.getItem('optional')).toBe('"value"');

    act(() => result.current[1](null));
    expect(window.sessionStorage.getItem('optional')).toBeNull();
  });

  it('falls back to the initial value when stored JSON is invalid', () => {
    window.sessionStorage.setItem('broken', '{');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useSessionStorage('broken', 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(consoleError).toHaveBeenCalledWith('Error leyendo sessionStorage:', expect.any(SyntaxError));
  });
});
