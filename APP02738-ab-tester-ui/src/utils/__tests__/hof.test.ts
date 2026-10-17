import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoaderStore } from '@/app/_common/contexts/Loader/state';
import { withLoader, withLog } from '../hof';

describe('withLoader', () => {
  beforeEach(() => {
    useLoaderStore.setState({ counter: 0 });
  });

  it('shows and hides the loader around a synchronous result', () => {
    const wrapped = withLoader((value: number) => value * 2);

    expect(wrapped(3)).toBe(6);
    expect(useLoaderStore.getState().counter).toBe(0);
  });

  it('hides the loader when the function throws synchronously', () => {
    const wrapped = withLoader(() => {
      throw new Error('failed');
    });

    expect(wrapped).toThrow('failed');
    expect(useLoaderStore.getState().counter).toBe(0);
  });

  it('hides the loader after a promise resolves or rejects', async () => {
    const resolved = withLoader(async () => 'done');
    await expect(resolved()).resolves.toBe('done');
    expect(useLoaderStore.getState().counter).toBe(0);

    const rejected = withLoader(async () => {
      throw new Error('failed');
    });
    await expect(rejected()).rejects.toThrow('failed');
    expect(useLoaderStore.getState().counter).toBe(0);
  });
});

describe('withLog', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs and returns synchronous results', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const calculate = withLog(function calculateTotal() {
      return 7;
    });

    expect(calculate()).toBe(7);
    expect(log).toHaveBeenCalledWith('Result calculateTotal() => ', 7);
  });

  it('logs and returns resolved promise results', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const load = withLog(async function loadValue() {
      return 'ready';
    });

    await expect(load()).resolves.toBe('ready');
    expect(log).toHaveBeenCalledWith('Result promised loadValue() => ', 'ready');
  });
});
