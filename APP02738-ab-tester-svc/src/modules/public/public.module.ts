import { Module } from '@nestjs/common';
import { AudienceRepository } from '../../repositories/audience.repository';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { ExecutionGroupRepository } from '../../repositories/executionGroup.repository';
import { LifecycleHookRepository } from '../../repositories/lifecycleHook.repository';
import { RoleRepository } from '../../repositories/role.repository';
import { TenantRepository } from '../../repositories/tenant.repository';
import { TrackEventRepository } from '../../repositories/trackEvent.repository';
import { UserRepository } from '../../repositories/user.repository';
import { AuthService } from '../../services/auth.service';
import { CacheService } from '../../services/cache.service';
import { DbService } from '../../services/db.service';
import { ScriptService } from '../../services/script.service';
import { AuthController } from './controllers/auth.controller';
import { ScriptController } from './controllers/script.controller';

@Module({
  controllers: [AuthController, ScriptController],
  providers: [
    AudienceRepository,
    TrackEventRepository,
    ExecutionGroupRepository,
    LifecycleHookRepository,
    CampaignRepository,
    RoleRepository,
    TenantRepository,
    UserRepository,
    DbService,
    ScriptService,
    CacheService,
    AuthService,
  ],
})
export class PublicModule {}
