import type { TypeApiCampaigns } from '@ab-tester/constants/types/api/campaigns';
import type { TypeNodeRequirement as TypeAudienceNodeRequirement } from '@ab-tester/constants/types/audience';
import type { TypeNodeRequirement as TypeCampaignNodeRequirement } from '@ab-tester/constants/types/campaign';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../../guards/auth.guard';
import { ZodResponse } from '../../interceptors/zod-response.interceptor';
import { getStringPermission } from '../../libs/auth/permissions';
import { DbService } from '../../services/db.service';
import { type Request } from '../../types/request';
import { campaignSchema, copyCampaignSchema, getCampaignsQuerySchema } from './request.schema';
import { campaignResponseSchemas } from './response.schema';
import { executionGroupSchema } from '../executionGroup.controller/request.schema';
import { TypeApiExecutionGroups } from '@ab-tester/constants/types/api/executionGroups';

const getAudienceIds = (requirements: TypeCampaignNodeRequirement): number[] => {
  const audienceIds = new Set<number>();
  const visit = (node: TypeCampaignNodeRequirement) => {
    for (const requirement of node.data.children) {
      if (requirement.type === 'node') visit(requirement);
      else if (requirement.type === 'audience') audienceIds.add(requirement.data.id);
    }
  };

  visit(requirements);
  return [...audienceIds];
};

const hasTrackEventRequirements = (requirements: TypeAudienceNodeRequirement): boolean => {
  for (const requirement of requirements.data.children) {
    if (requirement.type === 'node' && hasTrackEventRequirements(requirement)) return true;
    if (requirement.type !== 'node') return true;
  }
  return false;
};

@Controller('tenants/:tenantId/campaigns')
export class CampaignsController {
  constructor(private readonly dbService: DbService) {}

  @ZodResponse(campaignResponseSchemas.getMany)
  @UseGuards(AuthGuard({ action: 'read', feature: 'campaign' }))
  @Get()
  async getMany(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query({ schema: getCampaignsQuerySchema }) query: AssertEqual<z.infer<typeof getCampaignsQuerySchema>, TypeApiCampaigns['getMany']['request']['pathParams']>,
  ): Promise<TypeApiCampaigns['getMany']['response']> {
    const campaigns = await this.dbService.campaigns.getMany({ params: query, tenantId });
    return campaigns;
  }

  @ZodResponse(campaignResponseSchemas.getAllForExecutionGroup)
  @UseGuards(AuthGuard({ action: 'read', feature: 'campaign' }))
  @Get('getAllForExecutionGroup')
  async getAllLightVersion(@Param('tenantId', ParseIntPipe) tenantId: number): Promise<TypeApiCampaigns['getAllForExecutionGroup']['response']> {
    const campaigns = await this.dbService.campaigns.getAllForExecutionGroup({ tenantId });
    return { campaigns };
  }

  @ZodResponse(campaignResponseSchemas.get)
  @UseGuards(AuthGuard({ action: 'read', feature: 'campaign' }))
  @Get(':campaignId')
  async get(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('campaignId', ParseIntPipe) campaignId: number): Promise<TypeApiCampaigns['get']['response']> {
    const result = await this.dbService.campaigns.get({ campaignId, tenantId });
    if (!result) throw new NotFoundException();
    return result;
  }

  @ZodResponse(campaignResponseSchemas.create)
  @UseGuards(AuthGuard({ action: 'create', feature: 'campaign' }))
  @Post()
  async create(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body({ schema: campaignSchema }) body: AssertEqual<z.infer<typeof campaignSchema>, TypeApiCampaigns['create']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiCampaigns['create']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.dbService.campaigns.create({ tenantId, userId: user.id, values: body });
    return {};
  }

  @ZodResponse(campaignResponseSchemas.copy)
  @UseGuards(AuthGuard({ action: 'read', feature: 'campaign' }))
  @Post(':campaignId/copy')
  async copy(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Body({ schema: copyCampaignSchema }) body: AssertEqual<z.infer<typeof copyCampaignSchema>, TypeApiCampaigns['copy']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiCampaigns['copy']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const campaign = await this.dbService.campaigns.get({ campaignId, tenantId });
    if (!campaign) throw new NotFoundException();

    const audienceIds = getAudienceIds(campaign.requirements);
    const audiences = await Promise.all(audienceIds.map((audienceId) => this.dbService.audiences.get({ audienceId, tenantId })));
    if (audiences.some((audience) => !audience)) throw new NotFoundException('An audience used by this campaign was not found');
    const requiresTrackEventPermissions = audiences.some((audience) => audience && hasTrackEventRequirements(audience.requirements));

    const requiredPermissions = [
      getStringPermission({ action: 'create', feature: 'campaign', tenantId: body.targetTenantId }),
      ...(audienceIds.length > 0
        ? [
            getStringPermission({ action: 'read', feature: 'audience', tenantId }),
            getStringPermission({ action: 'create', feature: 'audience', tenantId: body.targetTenantId }),
          ]
        : []),
      ...(requiresTrackEventPermissions
        ? [
            getStringPermission({ action: 'read', feature: 'track-event', tenantId }),
            getStringPermission({ action: 'create', feature: 'track-event', tenantId: body.targetTenantId }),
          ]
        : []),
    ];
    if (!requiredPermissions.every((permission) => user.roles.some((role) => role.permissions.includes(permission)))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.dbService.campaigns.copy({
      campaignId,
      sourceTenantId: tenantId,
      targetTenantId: body.targetTenantId,
      userId: user.id,
    });
    return {};
  }

  @ZodResponse(campaignResponseSchemas.update)
  @UseGuards(AuthGuard({ action: 'update', feature: 'campaign' }))
  @Put(':campaignId')
  async update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Body({ schema: campaignSchema }) body: AssertEqual<z.infer<typeof campaignSchema>, TypeApiCampaigns['update']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiCampaigns['update']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.dbService.campaigns.update({ campaignId, tenantId, updates: body, userId: user.id });
    return {};
  }

  @ZodResponse(campaignResponseSchemas.remove)
  @UseGuards(AuthGuard({ action: 'delete', feature: 'campaign' }))
  @Delete(':campaignId')
  async remove(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('campaignId', ParseIntPipe) campaignId: number): Promise<TypeApiCampaigns['delete']['response']> {
    await this.dbService.campaigns.remove({ campaignId, tenantId });
    return {};
  }
}
