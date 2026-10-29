import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCampaignsQuerySchema } from '../../modules/ab-test/controllers/campaigns.controller/request.schema';
import { AccountController } from '../../modules/admin/controllers/account.controller';
import { zodQueryParameters } from '../decorators';
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

  it('generates query parameters from the Zod schema and marks preprocessed status filters optional', () => {
    const parameters = zodQueryParameters(getCampaignsQuerySchema);

    expect(parameters.find(({ name }) => name === 'page')).toMatchObject({
      example: 0,
      name: 'page',
      required: true,
      schema: { type: 'integer' },
    });
    expect(parameters.find(({ name }) => name === 'statusList')).toMatchObject({
      description: 'Repeat this parameter to filter by status.',
      example: ['active'],
      explode: true,
      name: 'statusList',
      required: false,
      schema: { items: { enum: ['inactive', 'active'], type: 'string' }, type: 'array' },
      style: 'form',
    });
  });
});
