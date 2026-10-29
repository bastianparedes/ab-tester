import { TypeApiExecutionGroups } from '@ab-tester/constants/types/api/executionGroups';
import type { TypeNodeRequirement as TypeAudienceNodeRequirement } from '@ab-tester/constants/types/audience';
import type { TypeCampaign, TypeNodeRequirement as TypeCampaignNodeRequirement } from '@ab-tester/constants/types/campaign';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { getStringPermission } from '../../../../libs/auth/permissions';
import { type Request } from '../../../../types/request';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodResponse } from '../../../common/interceptors/zod-response.interceptor';
import { DbService } from '../../../common/services/db.service';
import { copyExecutionGroupSchema, executionGroupSchema, getExecutionGroupsQuerySchema } from './request.schema';
import { executionGroupResponseSchemas } from './response.schema';

const getAudienceIds = (campaigns: TypeCampaign[]): number[] => {
  const audienceIds = new Set<number>();
  const visit = (node: TypeCampaignNodeRequirement) => {
    for (const requirement of node.data.children) {
      if (requirement.type === 'node') visit(requirement);
      else if (requirement.type === 'audience') audienceIds.add(requirement.data.id);
    }
  };
  for (const campaign of campaigns) visit(campaign.requirements);
  return [...audienceIds];
};

const hasTrackEventRequirements = (requirements: TypeAudienceNodeRequirement): boolean =>
  requirements.data.children.some((requirement) => (requirement.type === 'node' ? hasTrackEventRequirements(requirement) : true));

/* ---------- CONTROLLER ---------- */

@Controller('execution-groups')
export class ExecutionGroupsController {
  constructor(private readonly dbService: DbService) {}

  @ZodResponse(executionGroupResponseSchemas.copy)
  @UseGuards(AuthGuard({ action: 'read', feature: 'execution-group' }))
  @Post(':executionGroupId/copy')
  async copy(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('executionGroupId', ParseIntPipe) executionGroupId: number,
    @Body({ schema: copyExecutionGroupSchema }) body: AssertEqual<z.infer<typeof copyExecutionGroupSchema>, TypeApiExecutionGroups['copy']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiExecutionGroups['copy']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const sourceExecutionGroup = await this.dbService.executionGroup.get({ executionGroupId, tenantId });
    if (!sourceExecutionGroup) throw new NotFoundException();
    const campaigns = await Promise.all(sourceExecutionGroup.campaigns.map(({ id }) => this.dbService.campaigns.get({ campaignId: id, tenantId })));
    if (campaigns.some((campaign) => !campaign)) throw new NotFoundException('A campaign used by this execution group was not found');

    const sourceCampaigns = campaigns.filter((campaign) => campaign !== undefined);
    const audienceIds = getAudienceIds(sourceCampaigns);
    const audiences = await Promise.all(audienceIds.map((audienceId) => this.dbService.audiences.get({ audienceId, tenantId })));
    if (audiences.some((audience) => !audience)) throw new NotFoundException('An audience used by a campaign was not found');
    const requiresTrackEvents = audiences.some((audience) => audience && hasTrackEventRequirements(audience.requirements));

    const requiredPermissions = [
      getStringPermission({ action: 'create', feature: 'execution-group', tenantId: body.targetTenantId }),
      ...(sourceCampaigns.length > 0
        ? [
            getStringPermission({ action: 'read', feature: 'campaign', tenantId }),
            getStringPermission({ action: 'create', feature: 'campaign', tenantId: body.targetTenantId }),
          ]
        : []),
      ...(audienceIds.length > 0
        ? [
            getStringPermission({ action: 'read', feature: 'audience', tenantId }),
            getStringPermission({ action: 'create', feature: 'audience', tenantId: body.targetTenantId }),
          ]
        : []),
      ...(requiresTrackEvents
        ? [
            getStringPermission({ action: 'read', feature: 'track-event', tenantId }),
            getStringPermission({ action: 'create', feature: 'track-event', tenantId: body.targetTenantId }),
          ]
        : []),
    ];
    if (!requiredPermissions.every((permission) => user.roles.some((role) => role.permissions.includes(permission)))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.dbService.executionGroup.copy({
      executionGroupId,
      sourceTenantId: tenantId,
      targetTenantId: body.targetTenantId,
      userId: user.id,
    });
    return {};
  }

  @ZodResponse(executionGroupResponseSchemas.getMany)
  @UseGuards(AuthGuard({ action: 'read', feature: 'execution-group' }))
  @Get()
  async getMany(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query({ schema: getExecutionGroupsQuerySchema }) query: AssertEqual<
      z.infer<typeof getExecutionGroupsQuerySchema>,
      TypeApiExecutionGroups['getMany']['request']['queryParams']
    >,
  ): Promise<TypeApiExecutionGroups['getMany']['response']> {
    const executionGroups = await this.dbService.executionGroup.getMany({
      params: query,
      tenantId,
    });

    return executionGroups;
  }

  @ZodResponse(executionGroupResponseSchemas.get)
  @UseGuards(AuthGuard({ action: 'read', feature: 'execution-group' }))
  @Get(':executionGroupId')
  async get(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('executionGroupId', ParseIntPipe) executionGroupId: number,
  ): Promise<TypeApiExecutionGroups['get']['response']> {
    const result = await this.dbService.executionGroup.get({
      executionGroupId,
      tenantId,
    });

    if (!result) throw new NotFoundException();

    const { campaigns, executionGroup } = result;

    return { campaigns, executionGroup };
  }

  @ZodResponse(executionGroupResponseSchemas.create)
  @UseGuards(AuthGuard({ action: 'create', feature: 'execution-group' }))
  @Post()
  async create(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body({ schema: executionGroupSchema }) body: AssertEqual<z.infer<typeof executionGroupSchema>, TypeApiExecutionGroups['create']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiExecutionGroups['create']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const { campaignIds, ...values } = body;

    await this.dbService.executionGroup.create({
      campaignIds,
      tenantId,
      userId: user.id,
      values,
    });

    return {};
  }

  @ZodResponse(executionGroupResponseSchemas.update)
  @UseGuards(AuthGuard({ action: 'update', feature: 'execution-group' }))
  @Put(':executionGroupId')
  async update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('executionGroupId', ParseIntPipe) executionGroupId: number,
    @Body({ schema: executionGroupSchema }) body: AssertEqual<z.infer<typeof executionGroupSchema>, TypeApiExecutionGroups['update']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiExecutionGroups['update']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const { campaignIds, ...values } = body;

    await this.dbService.executionGroup.update({
      campaignIds,
      executionGroupId,
      tenantId,
      userId: user.id,
      values,
    });

    return {};
  }

  @ZodResponse(executionGroupResponseSchemas.remove)
  @UseGuards(AuthGuard({ action: 'delete', feature: 'execution-group' }))
  @Put(':executionGroupId/remove')
  async remove(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('executionGroupId', ParseIntPipe) executionGroupId: number,
  ): Promise<TypeApiExecutionGroups['update']['response']> {
    await this.dbService.executionGroup.remove({
      executionGroupId,
      tenantId,
    });

    return {};
  }
}
