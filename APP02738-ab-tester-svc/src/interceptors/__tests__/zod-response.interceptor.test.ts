import { type ExecutionContext, InternalServerErrorException, Logger } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tenantResponseSchemas } from '../../controllers/tenants.controller/response.schema';
import { ZodResponseInterceptor } from '../zod-response.interceptor';

describe('ZodResponse', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates and removes unknown fields from endpoint responses', async () => {
    const interceptor = new ZodResponseInterceptor(tenantResponseSchemas.get);
    const response = {
      description: '',
      domain: 'example.test',
      extra: 'removed',
      id: 1,
      name: 'Example',
    };

    await expect(lastValueFrom(interceptor.intercept(context, { handle: () => of(response) }))).resolves.toEqual({
      description: '',
      domain: 'example.test',
      id: 1,
      name: 'Example',
    });
  });

  it('logs and rejects invalid endpoint responses', async () => {
    const loggerError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const interceptor = new ZodResponseInterceptor(tenantResponseSchemas.get);
    const response = {
      description: '',
      domain: 'example.test',
      name: 'Example',
    };

    await expect(lastValueFrom(interceptor.intercept(context, { handle: () => of(response) }))).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(loggerError).toHaveBeenCalledOnce();
  });
});

const context = {
  switchToHttp: () => ({
    getRequest: () => ({ method: 'GET', url: '/tenants/1' }),
  }),
} as ExecutionContext;
