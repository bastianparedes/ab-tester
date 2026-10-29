import type { TypeUser } from '@ab-tester/constants/types/user';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { superAdminId } from '../../../../libs/constants';
import { env } from '../../../../libs/env';
import { DbService } from '../db.service';

vi.mock('../cache.service', () => ({ CacheService: class CacheService {} }));
vi.mock('../../repositories/postgres/client', () => ({ default: {} }));

describe('DbService', () => {
  const originalEnv = {
    nodeEnv: env.NODE_ENV,
    superAdminEmail: env.SUPER_ADMIN_EMAIL,
    superAdminPassword: env.SUPER_ADMIN_PASSWORD,
  };

  const createService = () => {
    const cacheService = {
      users: {
        clear: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockResolvedValue(undefined),
      },
    };
    const userRepository = {
      create: vi.fn(),
      get: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn(),
      getForLogin: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      updatePassword: vi.fn(),
    };
    const roleRepository = {};
    const tenantRepository = {};
    const audienceRepository = {};
    const campaignRepository = {
      create: vi.fn().mockResolvedValue('created campaign'),
      get: vi.fn(),
      getAllForExecutionGroup: vi.fn(),
      getMany: vi.fn(),
      remove: vi.fn().mockResolvedValue('removed campaign'),
      update: vi.fn().mockResolvedValue('updated campaign'),
    };
    const trackEventRepository = {};
    const executionGroupRepository = {
      create: vi.fn().mockResolvedValue('created group'),
      get: vi.fn(),
      getMany: vi.fn(),
      remove: vi.fn().mockResolvedValue('removed group'),
      update: vi.fn().mockResolvedValue('updated group'),
    };
    const lifecycleHookRepository = {};
    const scriptService = { clear: vi.fn().mockResolvedValue(undefined) };
    const service = new DbService(
      cacheService as never,
      userRepository as never,
      roleRepository as never,
      tenantRepository as never,
      audienceRepository as never,
      campaignRepository as never,
      trackEventRepository as never,
      executionGroupRepository as never,
      lifecycleHookRepository as never,
      scriptService as never,
    );

    return { cacheService, campaignRepository, executionGroupRepository, scriptService, service, userRepository };
  };

  beforeEach(() => {
    env.NODE_ENV = 'test';
    env.SUPER_ADMIN_EMAIL = undefined;
    env.SUPER_ADMIN_PASSWORD = undefined;
  });

  afterEach(() => {
    env.NODE_ENV = originalEnv.nodeEnv;
    env.SUPER_ADMIN_EMAIL = originalEnv.superAdminEmail;
    env.SUPER_ADMIN_PASSWORD = originalEnv.superAdminPassword;
  });

  it('uses cached users in production and caches database results', async () => {
    const { cacheService, service, userRepository } = createService();
    const cachedUser: TypeUser = { email: 'cached@example.test', id: 7, name: 'Cached', roles: [] };
    const databaseUser: TypeUser = { email: 'db@example.test', id: 8, name: 'Database', roles: [] };
    env.NODE_ENV = 'production';
    cacheService.users.get.mockResolvedValueOnce(cachedUser).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    userRepository.get.mockResolvedValueOnce(databaseUser).mockResolvedValueOnce(undefined);

    await expect(service.users.get({ userId: cachedUser.id })).resolves.toBe(cachedUser);
    expect(userRepository.get).not.toHaveBeenCalled();

    await expect(service.users.get({ userId: databaseUser.id })).resolves.toBe(databaseUser);
    expect(cacheService.users.save).toHaveBeenCalledWith({ user: databaseUser });

    await expect(service.users.get({ userId: 99 })).resolves.toBeUndefined();
    expect(cacheService.users.save).toHaveBeenCalledTimes(1);
  });

  it('returns the configured super admin and skips cache reads outside production', async () => {
    const { cacheService, service, userRepository } = createService();
    env.NODE_ENV = 'production';
    env.SUPER_ADMIN_EMAIL = 'admin@example.test';

    const user = await service.users.get({ userId: superAdminId });
    expect(user).toMatchObject({ email: 'admin@example.test', id: superAdminId, name: 'Super Admin' });
    expect(cacheService.users.save).toHaveBeenCalledWith({ user });
    expect(cacheService.users.get).toHaveBeenCalledWith({ userId: superAdminId });
    expect(userRepository.get).not.toHaveBeenCalled();

    env.NODE_ENV = 'test';
    cacheService.users.get.mockClear();
    const regularUser: TypeUser = { email: 'ada@example.test', id: 12, name: 'Ada', roles: [] };
    userRepository.get.mockResolvedValue(regularUser);

    await expect(service.users.get({ userId: regularUser.id })).resolves.toBe(regularUser);
    expect(cacheService.users.get).not.toHaveBeenCalled();
  });

  it('looks up login credentials and supports the configured super admin', async () => {
    const { service, userRepository } = createService();
    const loginUser = { email: 'ada@example.test', id: 7, passwordHash: 'hash' };
    userRepository.getForLogin.mockResolvedValueOnce(loginUser).mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);
    env.SUPER_ADMIN_EMAIL = 'admin@example.test';

    await expect(service.users.getForLogin({ email: loginUser.email })).resolves.toBe(loginUser);

    const adminWithoutConfiguredPassword = await service.users.getForLogin({ email: 'admin@example.test' });
    expect(adminWithoutConfiguredPassword?.passwordHash).toBeTruthy();

    env.SUPER_ADMIN_PASSWORD = 'secret';
    const admin = await service.users.getForLogin({ email: 'admin@example.test' });
    expect(admin).toMatchObject({ email: 'admin@example.test', id: superAdminId });
    expect(admin?.passwordHash).toBeTruthy();
    await expect(service.users.getForLogin({ email: 'unknown@example.test' })).resolves.toBeUndefined();
  });

  it('clears user cache on removal and caches updated users', async () => {
    const { cacheService, service, userRepository } = createService();
    const user: TypeUser = { email: 'ada@example.test', id: 7, name: 'Ada', roles: [] };
    userRepository.remove.mockResolvedValue(user);
    userRepository.get.mockResolvedValue(user);

    await expect(service.users.remove({ userId: user.id })).resolves.toBe(user);
    expect(cacheService.users.clear).toHaveBeenCalledWith({ userIds: [user.id] });

    await expect(service.users.update({ updates: { name: 'Ada Lovelace' }, userId: user.id } as never)).resolves.toBeUndefined();
    expect(userRepository.get).toHaveBeenCalledWith({ userId: user.id });
    expect(cacheService.users.save).toHaveBeenCalledWith({ user });

    userRepository.get.mockResolvedValueOnce(undefined);
    await expect(service.users.update({ updates: { name: 'Missing' }, userId: user.id } as never)).rejects.toThrow('Could not get recently updated user');
  });

  it('invalidates scripts after campaign and execution-group mutations', async () => {
    const { campaignRepository, executionGroupRepository, scriptService, service } = createService();
    const campaignInput = { tenantId: 3, values: { name: 'Campaign' } };
    const groupInput = { tenantId: 4, values: { name: 'Group' } };

    await expect(service.campaigns.create(campaignInput as never)).resolves.toBe('created campaign');
    await expect(service.campaigns.remove({ campaignId: 5, tenantId: 3 })).resolves.toBe('removed campaign');
    await expect(service.campaigns.update({ campaignId: 5, tenantId: 3, updates: {} } as never)).resolves.toBe('updated campaign');

    await expect(service.executionGroup.create(groupInput as never)).resolves.toBe('created group');
    await expect(service.executionGroup.remove({ executionGroupId: 6, tenantId: 4 })).resolves.toBe('removed group');
    await expect(service.executionGroup.update({ executionGroupId: 6, tenantId: 4, updates: {} } as never)).resolves.toBe('updated group');

    expect(campaignRepository.create).toHaveBeenCalledWith(campaignInput);
    expect(executionGroupRepository.create).toHaveBeenCalledWith(groupInput);
    expect(scriptService.clear).toHaveBeenNthCalledWith(1, { tenantId: 3 });
    expect(scriptService.clear).toHaveBeenNthCalledWith(6, { tenantId: 4 });
  });
});
