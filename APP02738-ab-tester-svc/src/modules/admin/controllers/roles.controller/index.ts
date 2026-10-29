import { TypeApiRoles } from '@ab-tester/constants/types/api/roles';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodResponse } from '../../../common/interceptors/zod-response.interceptor';
import { DbService } from '../../../common/services/db.service';
import { roleSchema } from './request.schema';
import { roleResponseSchemas } from './response.schema';

/* ---------- CONTROLLER ---------- */

@Controller('roles')
export class RolesController {
  constructor(private readonly dbService: DbService) {}

  @ZodResponse(roleResponseSchemas.getAll)
  @UseGuards(AuthGuard({ action: 'read', feature: 'role' }))
  @Get()
  async getAll(): Promise<TypeApiRoles['getAll']['response']> {
    const roles = await this.dbService.roles.getAll();
    return roles;
  }

  @ZodResponse(roleResponseSchemas.create)
  @UseGuards(AuthGuard({ action: 'create', feature: 'role' }))
  @Post()
  async create(
    @Body({ schema: roleSchema }) body: AssertEqual<z.infer<typeof roleSchema>, TypeApiRoles['create']['request']['body']>,
  ): Promise<TypeApiRoles['create']['response']> {
    await this.dbService.roles.create(body);
    return {};
  }

  @ZodResponse(roleResponseSchemas.update)
  @UseGuards(AuthGuard({ action: 'update', feature: 'role' }))
  @Put(':roleId')
  async update(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body({ schema: roleSchema }) body: AssertEqual<z.infer<typeof roleSchema>, TypeApiRoles['update']['request']['body']>,
  ): Promise<TypeApiRoles['update']['response']> {
    await this.dbService.roles.update({
      roleId,
      updates: body,
    });

    return {};
  }

  @ZodResponse(roleResponseSchemas.remove)
  @UseGuards(AuthGuard({ action: 'delete', feature: 'role' }))
  @Delete(':roleId')
  async remove(@Param('roleId', ParseIntPipe) roleId: number): Promise<TypeApiRoles['delete']['response']> {
    await this.dbService.roles.remove({ roleId });
    return {};
  }
}
