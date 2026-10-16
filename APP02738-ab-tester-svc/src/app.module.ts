import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AccountController } from './controllers/account.controller';
import { AudiencesController } from './controllers/audiences.controller';
import { CampaignsController } from './controllers/campaigns.controller';
import { ExecutionGroupsController } from './controllers/executionGroup.controller';
import { HealthController } from './controllers/health.controller';
import { LifecycleHookController } from './controllers/lifecycleHook.controller';
import { RolesController } from './controllers/roles.controller';
import { TenantsController } from './controllers/tenants.controller';
import { TrackEventController } from './controllers/trackEvent.controller';
import { UsersController } from './controllers/users.controller';
import { EventsGateway } from './gateways/campaigns.gateway';
import { PublicModule } from './modules/public/public.module';
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
import { ScriptService } from './services/script.service';

@Module({
  controllers: [
    AudiencesController,
    TrackEventController,
    RolesController,
    CampaignsController,
    TenantsController,
    UsersController,
    AccountController,
    HealthController,
    LifecycleHookController,
    ExecutionGroupsController,
  ],
  imports: [
    PublicModule,
    RouterModule.register([
      {
        module: PublicModule,
        path: 'public',
      },
    ]),
  ],
  providers: [
    AudienceRepository,
    TrackEventRepository,
    ExecutionGroupRepository,
    CampaignRepository,
    LifecycleHookRepository,
    RoleRepository,
    TenantRepository,
    UserRepository,
    DbService,
    ScriptService,
    CacheService,
    AuthService,
    EventsGateway,
  ],
})
export class AppModule {}
