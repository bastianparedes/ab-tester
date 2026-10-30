import type { TypeApiLifecycleHooks } from '@ab-tester/constants/types/api/lifecycleHooks';
import type { TypeLifecycleHook } from '@ab-tester/constants/types/lifecycleHooks';
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
import { getStringPermission } from '../../../../libs/auth/permissions';
import { type Request } from '../../../../types/request';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodResponse } from '../../../common/interceptors/zod-response.interceptor';
import { DbService } from '../../../common/services/db.service';
import { ScriptService } from '../../services/script.service';
import { copyLifecycleHookSchema, getLifecycleHooksQuerySchema, lifecycleHookSchema } from './request.schema';
import { lifecycleHookResponseSchemas } from './response.schema';

type LifecycleHookValues = Pick<TypeLifecycleHook, 'status' | 'name' | 'option' | 'javascript'>;

@Controller('lifecycle-hooks')
export class LifecycleHookController {
  constructor(
    private readonly dbService: DbService,
    private readonly scriptService: ScriptService,
  ) {}

  @ZodResponse(lifecycleHookResponseSchemas.copy)
  @UseGuards(AuthGuard({ action: 'read', feature: 'lifecycle-hook' }))
  @Post(':lifecycleHookId/copy')
  async copy(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('lifecycleHookId', ParseIntPipe) lifecycleHookId: number,
    @Body({ schema: copyLifecycleHookSchema }) body: AssertEqual<z.infer<typeof copyLifecycleHookSchema>, TypeApiLifecycleHooks['copy']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiLifecycleHooks['copy']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    const createPermission = getStringPermission({ action: 'create', feature: 'lifecycle-hook', tenantId: body.targetTenantId });
    if (!user.roles.some((role) => role.permissions.includes(createPermission))) throw new ForbiddenException('Insufficient permissions');

    const copiedLifecycleHook = await this.dbService.lifecycleHooks.copy({
      lifecycleHookId,
      targetTenantId: body.targetTenantId,
      tenantId,
      userId: user.id,
    });
    if (!copiedLifecycleHook) throw new NotFoundException();
    await this.scriptService.clear({ tenantId: body.targetTenantId });
    return {};
  }

  @ZodResponse(lifecycleHookResponseSchemas.getMany)
  @UseGuards(AuthGuard({ action: 'read', feature: 'lifecycle-hook' }))
  @Get()
  async getMany(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query({ schema: getLifecycleHooksQuerySchema }) query: AssertEqual<
      z.infer<typeof getLifecycleHooksQuerySchema>,
      TypeApiLifecycleHooks['getMany']['request']['queryParams']
    >,
  ): Promise<TypeApiLifecycleHooks['getMany']['response']> {
    return this.dbService.lifecycleHooks.getMany({ params: query, tenantId });
  }

  @ZodResponse(lifecycleHookResponseSchemas.get)
  @UseGuards(AuthGuard({ action: 'read', feature: 'lifecycle-hook' }))
  @Get(':lifecycleHookId')
  async get(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('lifecycleHookId', ParseIntPipe) lifecycleHookId: number) {
    const lifecycleHook = await this.dbService.lifecycleHooks.get({
      lifecycleHookId,
      tenantId,
    });

    if (!lifecycleHook) throw new NotFoundException();
    return { lifecycleHook };
  }

  @ZodResponse(lifecycleHookResponseSchemas.create)
  @UseGuards(AuthGuard({ action: 'create', feature: 'lifecycle-hook' }))
  @Post()
  async create(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body({ schema: lifecycleHookSchema }) body: AssertEqual<z.infer<typeof lifecycleHookSchema>, LifecycleHookValues>,
    @Req() req: Request,
  ): Promise<Record<string, never>> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.dbService.lifecycleHooks.create({
      tenantId,
      userId: user.id,
      values: body,
    });
    await this.scriptService.clear({ tenantId });

    return {};
  }

  @ZodResponse(lifecycleHookResponseSchemas.update)
  @UseGuards(AuthGuard({ action: 'update', feature: 'lifecycle-hook' }))
  @Put(':lifecycleHookId')
  async update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('lifecycleHookId', ParseIntPipe) lifecycleHookId: number,
    @Body({ schema: lifecycleHookSchema }) body: AssertEqual<z.infer<typeof lifecycleHookSchema>, LifecycleHookValues>,
  ): Promise<Record<string, never>> {
    const lifecycleHook = await this.dbService.lifecycleHooks.update({
      lifecycleHookId,
      tenantId,
      values: body,
    });

    if (!lifecycleHook) throw new NotFoundException();
    await this.scriptService.clear({ tenantId });
    return {};
  }

  @ZodResponse(lifecycleHookResponseSchemas.remove)
  @UseGuards(AuthGuard({ action: 'delete', feature: 'lifecycle-hook' }))
  @Delete(':lifecycleHookId')
  async remove(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('lifecycleHookId', ParseIntPipe) lifecycleHookId: number): Promise<Record<string, never>> {
    const lifecycleHook = await this.dbService.lifecycleHooks.remove({
      lifecycleHookId,
      tenantId,
    });

    if (!lifecycleHook) throw new NotFoundException();
    await this.scriptService.clear({ tenantId });
    return {};
  }
}
