import { TypeApiExecutionGroups } from '@ab-tester/constants/types/api/executionGroups';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../../guards/auth.guard';
import { ZodResponse } from '../../interceptors/zod-response.interceptor';
import { DbService } from '../../services/db.service';
import { type Request } from '../../types/request';
import { executionGroupSchema, getExecutionGroupsQuerySchema } from './request.schema';
import { executionGroupResponseSchemas } from './response.schema';

/* ---------- CONTROLLER ---------- */

@Controller('tenants/:tenantId/execution-groups')
export class ExecutionGroupsController {
  constructor(private readonly dbService: DbService) {}

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
