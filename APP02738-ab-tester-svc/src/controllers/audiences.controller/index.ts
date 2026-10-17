import { TypeApiAudiences } from '@ab-tester/constants/types/api/audiences';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../../guards/auth.guard';
import { ZodResponse } from '../../interceptors/zod-response.interceptor';
import { DbService } from '../../services/db.service';
import { type Request } from '../../types/request';
import { audienceSchema, getAudiencesQuerySchema } from './request.schema';
import { audienceResponseSchemas } from './response.schema';

@Controller('tenants/:tenantId/audiences')
export class AudiencesController {
  constructor(private readonly dbService: DbService) {}

  @ZodResponse(audienceResponseSchemas.getMany)
  @UseGuards(AuthGuard({ action: 'read', feature: 'audience' }))
  @Get()
  async getMany(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query({ schema: getAudiencesQuerySchema }) query: AssertEqual<z.infer<typeof getAudiencesQuerySchema>, TypeApiAudiences['getMany']['request']['pathParams']>,
  ): Promise<TypeApiAudiences['getMany']['response']> {
    const audiences = await this.dbService.audiences.getMany({ params: query, tenantId });
    return audiences;
  }

  @ZodResponse(audienceResponseSchemas.getAllForCampaign)
  @UseGuards(AuthGuard({ action: 'read', feature: 'audience' }))
  @Get('getAllForCampaign')
  async getAllForCampaign(@Param('tenantId', ParseIntPipe) tenantId: number): Promise<TypeApiAudiences['getAllForCampaign']['response']> {
    const audiences = await this.dbService.audiences.getAllForCampaign({ tenantId });
    return { audiences };
  }

  @ZodResponse(audienceResponseSchemas.get)
  @UseGuards(AuthGuard({ action: 'read', feature: 'audience' }))
  @Get(':audienceId')
  async get(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('audienceId', ParseIntPipe) audienceId: number): Promise<TypeApiAudiences['get']['response']> {
    const result = await this.dbService.audiences.get({ audienceId, tenantId });
    if (!result) throw new NotFoundException();
    return result;
  }

  @ZodResponse(audienceResponseSchemas.create)
  @UseGuards(AuthGuard({ action: 'create', feature: 'audience' }))
  @Post()
  async create(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body({ schema: audienceSchema }) body: AssertEqual<z.infer<typeof audienceSchema>, TypeApiAudiences['create']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiAudiences['create']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.dbService.audiences.create({ tenantId, userId: user.id, values: body });
    return {};
  }

  @ZodResponse(audienceResponseSchemas.update)
  @UseGuards(AuthGuard({ action: 'update', feature: 'audience' }))
  @Put(':audienceId')
  async update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('audienceId', ParseIntPipe) audienceId: number,
    @Body({ schema: audienceSchema }) body: AssertEqual<z.infer<typeof audienceSchema>, TypeApiAudiences['update']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiAudiences['update']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.dbService.audiences.update({ audienceId, tenantId, updates: body, userId: user.id });
    return {};
  }

  @ZodResponse(audienceResponseSchemas.remove)
  @UseGuards(AuthGuard({ action: 'delete', feature: 'audience' }))
  @Delete(':audienceId')
  async remove(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('audienceId', ParseIntPipe) audienceId: number): Promise<TypeApiAudiences['delete']['response']> {
    await this.dbService.audiences.remove({ audienceId, tenantId });
    return {};
  }
}
