import { Module } from '@nestjs/common';

import { CommonModule } from '../common/common.module';
import { AudiencesController } from './controllers/audiences.controller';
import { CampaignsController } from './controllers/campaigns.controller';
import { ExecutionGroupsController } from './controllers/executionGroup.controller';
import { HealthController } from './controllers/health.controller';
import { LifecycleHookController } from './controllers/lifecycleHook.controller';
import { ScriptController } from './controllers/script.controller';
import { TrackEventController } from './controllers/trackEvent.controller';

@Module({
  controllers: [AudiencesController, TrackEventController, CampaignsController, HealthController, LifecycleHookController, ScriptController, ExecutionGroupsController],
  imports: [CommonModule],
})
export class AbTestModule {}
