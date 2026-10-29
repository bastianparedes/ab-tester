import { Global, Module } from '@nestjs/common';
import { ScriptService } from '../ab-test/services/script.service';
import { AudienceRepository } from './repositories/audience.repository';
import { CampaignRepository } from './repositories/campaign.repository';
import { ExecutionGroupRepository } from './repositories/executionGroup.repository';
import { LifecycleHookRepository } from './repositories/lifecycleHook.repository';
import { RoleRepository } from './repositories/role.repository';
import { TenantRepository } from './repositories/tenant.repository';
import { TrackEventRepository } from './repositories/trackEvent.repository';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './services/auth.service';
import { CacheService } from './services/cache.service';
import { DbService } from './services/db.service';

@Global()
@Module({
  exports: [
    AudienceRepository,
    AuthService,
    CacheService,
    CampaignRepository,
    DbService,
    ExecutionGroupRepository,
    LifecycleHookRepository,
    RoleRepository,
    ScriptService,
    TenantRepository,
    TrackEventRepository,
    UserRepository,
  ],
  providers: [
    AudienceRepository,
    CampaignRepository,
    DbService,
    ExecutionGroupRepository,
    LifecycleHookRepository,
    RoleRepository,
    ScriptService,
    TenantRepository,
    TrackEventRepository,
    UserRepository,
    AuthService,
    CacheService,
  ],
})
export class CommonModule {}
