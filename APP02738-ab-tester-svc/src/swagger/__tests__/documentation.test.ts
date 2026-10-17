import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountController } from '../../controllers/account.controller';
import { applySwaggerDocumentation } from '../documentation';

describe('Swagger documentation binding', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips operations without a decorator list', () => {
    const objectKeys = Object.keys;
    vi.spyOn(Object, 'keys').mockImplementation((value: object) => {
      if (Object.hasOwn(value, 'updateAccount')) return ['missingOperation'];
      return objectKeys(value);
    });

    expect(applySwaggerDocumentation).not.toThrow();
  });

  it('throws when documentation targets a missing controller handler', () => {
    const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    vi.spyOn(Object, 'getOwnPropertyDescriptor').mockImplementation((target, property) => {
      if (target === AccountController.prototype && property === 'updateAccount') return undefined;
      return getOwnPropertyDescriptor(target, property);
    });

    expect(applySwaggerDocumentation).toThrow('Swagger documentation refers to missing handler AccountController.updateAccount');
  });
});
