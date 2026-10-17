import { TypeApiTenants } from '@ab-tester/constants/types/api/tenants';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../../guards/auth.guard';
import { ZodResponse } from '../../interceptors/zod-response.interceptor';
import { DbService } from '../../services/db.service';
import { tenantSchema } from './request.schema';
import { tenantResponseSchemas } from './response.schema';

/* ---------- CONTROLLER ---------- */

@Controller('tenants')
export class TenantsController {
  constructor(private readonly dbService: DbService) {}

  @ZodResponse(tenantResponseSchemas.getAll)
  @Get()
  async getAll(): Promise<TypeApiTenants['getAll']['response']> {
    const tenants = await this.dbService.tenants.getAll();
    return tenants;
  }

  @ZodResponse(tenantResponseSchemas.get)
  @UseGuards(AuthGuard({ action: 'read', feature: 'tenant' }))
  @Get(':tenantId')
  async get(@Param('tenantId', ParseIntPipe) tenantId: number): Promise<TypeApiTenants['get']['response']> {
    const tenant = await this.dbService.tenants.get({ tenantId });

    if (!tenant) throw new NotFoundException();

    return tenant;
  }

  @ZodResponse(tenantResponseSchemas.create)
  @UseGuards(AuthGuard({ action: 'create', feature: 'tenant' }))
  @Post()
  async create(
    @Body({ schema: tenantSchema }) body: AssertEqual<z.infer<typeof tenantSchema>, TypeApiTenants['create']['request']['body']>,
  ): Promise<TypeApiTenants['create']['response']> {
    const newTenant = await this.dbService.tenants.create(body);
    return newTenant;
  }

  @ZodResponse(tenantResponseSchemas.update)
  @UseGuards(AuthGuard({ action: 'update', feature: 'tenant' }))
  @Put(':tenantId')
  async update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body({ schema: tenantSchema }) body: AssertEqual<z.infer<typeof tenantSchema>, TypeApiTenants['update']['request']['body']>,
  ): Promise<TypeApiTenants['update']['response']> {
    const newTenant = await this.dbService.tenants.update({
      tenantId,
      values: body,
    });

    return newTenant;
  }

  @ZodResponse(tenantResponseSchemas.remove)
  @UseGuards(AuthGuard({ action: 'delete', feature: 'tenant' }))
  @Delete(':tenantId')
  async remove(@Param('tenantId', ParseIntPipe) tenantId: number): Promise<TypeApiTenants['delete']['response']> {
    const removedTenant = await this.dbService.tenants.remove({ tenantId });

    if (!removedTenant) throw new NotFoundException();

    return removedTenant;
  }
}
