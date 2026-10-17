import type { TypeApiLifecycleHooks } from '@ab-tester/constants/types/api/lifecycleHooks';
import type { TypeLifecycleHook } from '@ab-tester/constants/types/lifecycleHooks';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../guards/auth.guard';
import { jsCodeIsSingleAsyncArrowFunction } from '../libs/jsCode';
import commonConstants from '../libs/sharedConstants';
import { DbService } from '../services/db.service';
import { ScriptService } from '../services/script.service';
import { type Request } from '../types/request';

export const lifecycleHookSchema = z
  .object({
    javascript: z.string().refine(jsCodeIsSingleAsyncArrowFunction, {
      message: 'JavaScript must contain exactly one async arrow function',
    }),
    name: z.string(),
    option: z.enum(commonConstants.lifecycleHookOptionsArray),
    status: z.enum(commonConstants.arrayStatusArray),
  })
  .strip();

type LifecycleHookValues = Pick<TypeLifecycleHook, 'status' | 'name' | 'option' | 'javascript'>;

export const getLifecycleHooksQuerySchema = z
  .object({
    orderBy: z.enum(['id', 'name', 'option', 'status', 'updatedAt']),
    orderDirection: z.enum(commonConstants.orderDirectionArray),
    page: z.coerce.number().int(),
    quantity: z.coerce.number().int(),
    statusList: z.preprocess(
      (value) => {
        if (!value) return [];
        if (typeof value === 'string') return [value];
        return value;
      },
      z.array(z.enum(commonConstants.arrayStatusArray)),
    ),
    textSearch: z.string().default(''),
  })
  .strip();

@Controller('tenants/:tenantId/lifecycle-hooks')
export class LifecycleHookController {
  constructor(
    private readonly dbService: DbService,
    private readonly scriptService: ScriptService,
  ) {}

  @UseGuards(AuthGuard({ action: 'read', feature: 'tenant' }))
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

  @UseGuards(AuthGuard({ action: 'read', feature: 'tenant' }))
  @Get(':lifecycleHookId')
  async get(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('lifecycleHookId', ParseIntPipe) lifecycleHookId: number) {
    const lifecycleHook = await this.dbService.lifecycleHooks.get({
      lifecycleHookId,
      tenantId,
    });

    if (!lifecycleHook) throw new NotFoundException();
    return { lifecycleHook };
  }

  @UseGuards(AuthGuard({ action: 'create', feature: 'tenant' }))
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

  @UseGuards(AuthGuard({ action: 'update', feature: 'tenant' }))
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

  @UseGuards(AuthGuard({ action: 'delete', feature: 'tenant' }))
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
