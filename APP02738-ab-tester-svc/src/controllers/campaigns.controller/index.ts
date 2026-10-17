import { TypeApiCampaigns } from '@ab-tester/constants/types/api/campaigns';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../../guards/auth.guard';
import { ZodResponse } from '../../interceptors/zod-response.interceptor';
import { DbService } from '../../services/db.service';
import { type Request } from '../../types/request';
import { campaignSchema, getCampaignsQuerySchema } from './request.schema';
import { campaignResponseSchemas } from './response.schema';

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
