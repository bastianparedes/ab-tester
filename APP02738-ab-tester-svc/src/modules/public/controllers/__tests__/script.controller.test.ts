import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScriptController } from '../script.controller';

describe('ScriptController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the tenant script from the script service', async () => {
    const getScript = vi.fn().mockResolvedValue('tenant script');
    const controller = new ScriptController({ getScript } as never);

    await expect(controller.get(12)).resolves.toBe('tenant script');
    expect(getScript).toHaveBeenCalledWith({ tenantId: 12 });
  });

  it('serves the packaged debug panel script', () => {
    const readFileSync = vi.spyOn(fs, 'readFileSync').mockReturnValue('debug panel source');
    const controller = new ScriptController({} as never);

    expect(controller.getScript()).toBe('debug panel source');
    expect(readFileSync).toHaveBeenCalledWith(expect.stringContaining('debug-panel'), 'utf-8');
  });
});
