import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HealthController } from '../index';

describe('HealthController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports whether the generated script exists', async () => {
    const existsSync = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const controller = new HealthController();

    await expect(controller.get()).resolves.toEqual({ deployed: true, fileExists: true });
    expect(existsSync).toHaveBeenCalledOnce();

    existsSync.mockReturnValue(false);
    await expect(controller.get()).resolves.toEqual({ deployed: true, fileExists: false });
  });
});
