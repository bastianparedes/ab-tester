import { Injectable } from '@nestjs/common';
import { getPasswordHashed } from '../libs/auth/password';
import { superAdminId, superAdminPermissions } from '../libs/constants';
import { env } from '../libs/env';
import { AudienceRepository } from '../repositories/audience.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import { ExecutionGroupRepository } from '../repositories/executionGroup.repository';
import { LifecycleHookRepository } from '../repositories/lifecycleHook.repository';
import { RoleRepository } from '../repositories/role.repository';
import { TenantRepository } from '../repositories/tenant.repository';
import { TrackEventRepository } from '../repositories/trackEvent.repository';
import { UserRepository } from '../repositories/user.repository';
import { CacheService } from './cache.service';
import { ScriptService } from './script.service';

@Injectable()
export class DbService {
  users: UserRepository;
  roles: RoleRepository;
  tenants: TenantRepository;
  executionGroup: ExecutionGroupRepository;
  audiences: AudienceRepository;
  campaigns: CampaignRepository;
  trackEvents: TrackEventRepository;
  lifecycleHooks: LifecycleHookRepository;
  constructor(
    private readonly cacheService: CacheService,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly audienceRepository: AudienceRepository,
    private readonly campaignRepository: CampaignRepository,
    private readonly trackEventRepository: TrackEventRepository,
    private readonly executionGroupRepository: ExecutionGroupRepository,
    private readonly lifecycleHookRepository: LifecycleHookRepository,
    private readonly scriptService: ScriptService,
  ) {
    this.audiences = this.audienceRepository;
    this.trackEvents = this.trackEventRepository;
    this.lifecycleHooks = this.lifecycleHookRepository;
    this.users = {
      ...this.userRepository,
      create: this.userRepository.create,
      get: async (args) => {
        if (env.NODE_ENV === 'production') {
          const cached = await this.cacheService.users.get({ userId: args.userId });
          if (cached) return cached;
        }

        if (env.SUPER_ADMIN_EMAIL && args.userId === superAdminId) {
          const user = {
            email: env.SUPER_ADMIN_EMAIL,
            id: superAdminId,
            name: 'Super Admin',
            roles: [
              {
                description: 'Super admin is GOD',
                id: -1,
                name: 'Super Admin Role',
                permissions: superAdminPermissions,
              },
            ],
          };
          await this.cacheService.users.save({ user });
          return user;
        }

        const user = await this.userRepository.get(args);
        if (user) await this.cacheService.users.save({ user });
        return user;
      },
      getAll: this.userRepository.getAll,
      getForLogin: async (args) => {
        const userFromDb = await this.userRepository.getForLogin(args);
        if (userFromDb) return userFromDb;

        if (args.email === env.SUPER_ADMIN_EMAIL)
          return {
            email: env.SUPER_ADMIN_EMAIL,
            id: superAdminId,
            passwordHash: getPasswordHashed(env.SUPER_ADMIN_PASSWORD ?? ''),
          };

        return undefined;
      },
      remove: async (args) => {
        const removedUser = await this.userRepository.remove(args);
        await this.cacheService.users.clear({ userIds: [args.userId] });
        return removedUser;
      },
      update: async (args) => {
        await this.userRepository.update(args);
        const user = await this.userRepository.get({ userId: args.userId });
        if (!user) throw new Error('Could not get recently updated user');
        await this.cacheService.users.save({ user });
      },
      updatePassword: this.userRepository.updatePassword,
    };
    this.roles = this.roleRepository;
    this.tenants = this.tenantRepository;
    this.campaigns = {
      ...this.campaignRepository,
      create: async (args) => {
        const result = await this.campaignRepository.create(args);
        await this.scriptService.clear({ tenantId: args.tenantId });
        return result;
      },
      remove: async (args) => {
        const result = await this.campaignRepository.remove(args);
        await this.scriptService.clear({ tenantId: args.tenantId });
        return result;
      },
      update: async (args) => {
        const result = await this.campaignRepository.update(args);
        await this.scriptService.clear({ tenantId: args.tenantId });
        return result;
      },
    };
    this.executionGroup = {
      ...this.executionGroupRepository,
      create: async (args) => {
        const result = await this.executionGroupRepository.create(args);
        await this.scriptService.clear({ tenantId: args.tenantId });
        return result;
      },
      remove: async (args) => {
        const result = await this.executionGroupRepository.remove(args);
        await this.scriptService.clear({ tenantId: args.tenantId });
        return result;
      },
      update: async (args) => {
        const result = await this.executionGroupRepository.update(args);
        await this.scriptService.clear({ tenantId: args.tenantId });
        return result;
      },
    };
  }
}
