import { TypeApiRoles } from '@ab-tester/constants/types/api/roles';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthGuard } from '../guards/auth.guard';
import { DbService } from '../services/db.service';

/* ---------- SCHEMAS ---------- */
export const roleSchema = z
  .object({
    description: z.string(),
    name: z.string(),
    permissions: z.array(z.string()).optional().default([]),
  })
  .strip();

/* ---------- CONTROLLER ---------- */

@ApiTags('roles')
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly dbService: DbService) {}

  @UseGuards(AuthGuard({ action: 'read', feature: 'role' }))
  @Get()
  async getAll(): Promise<TypeApiRoles['getAll']['response']> {
    const roles = await this.dbService.roles.getAll();
    return roles;
  }

  @UseGuards(AuthGuard({ action: 'create', feature: 'role' }))
  @Post()
  async create(
    @Body({ schema: roleSchema }) body: AssertEqual<z.infer<typeof roleSchema>, TypeApiRoles['create']['request']['body']>,
  ): Promise<TypeApiRoles['create']['response']> {
    await this.dbService.roles.create(body);
    return {};
  }

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

  @UseGuards(AuthGuard({ action: 'delete', feature: 'role' }))
  @Delete(':roleId')
  async remove(@Param('roleId', ParseIntPipe) roleId: number): Promise<TypeApiRoles['delete']['response']> {
    await this.dbService.roles.remove({ roleId });
    return {};
  }
}
