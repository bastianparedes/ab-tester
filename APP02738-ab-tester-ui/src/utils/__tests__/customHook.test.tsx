// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from '../customHook';

const HookHarness = ({ initialValue, storageKey = 'test-value' }: { initialValue: string; storageKey?: string }) => {
  const [value, setValue] = useLocalStorage(storageKey, initialValue);
  return (
    <button type="button" onClick={() => setValue(`${value}!`)}>
      {value}
    </button>
  );
};

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('useLocalStorage', () => {
  it('uses the initial value when the key is missing and persists updates', () => {
    render(<HookHarness initialValue="start" />);
    expect(screen.getByRole('button', { name: 'start' })).toBeTruthy();
    expect(window.localStorage.getItem('test-value')).toBe('"start"');

    fireEvent.click(screen.getByRole('button', { name: 'start' }));

    expect(screen.getByRole('button', { name: 'start!' })).toBeTruthy();
    expect(window.localStorage.getItem('test-value')).toBe('"start!"');
  });

  it('restores a valid JSON value already in storage', () => {
    window.localStorage.setItem('test-value', JSON.stringify('restored'));
    render(<HookHarness initialValue="default" />);

    expect(screen.getByRole('button', { name: 'restored' })).toBeTruthy();
    expect(window.localStorage.getItem('test-value')).toBe('"restored"');
  });

  it('falls back to the initial value when stored JSON is invalid', () => {
    window.localStorage.setItem('test-value', '{invalid');
    render(<HookHarness initialValue="fallback" />);

    expect(screen.getByRole('button', { name: 'fallback' })).toBeTruthy();
    expect(window.localStorage.getItem('test-value')).toBe('"fallback"');
  });

  it('falls back to the initial value when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    render(<HookHarness initialValue="fallback" />);

    expect(screen.getByRole('button', { name: 'fallback' })).toBeTruthy();
  });
});
