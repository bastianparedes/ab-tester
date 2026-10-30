import { TypeApiUsers } from '@ab-tester/constants/types/api/users';
import { TypeUser } from '@ab-tester/constants/types/user';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { getTokenData } from '../../../../libs/auth/jwt';
import { cookieNames } from '../../../../libs/constants';
import { type Request } from '../../../../types/request';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodResponse } from '../../../common/interceptors/zod-response.interceptor';
import { DbService } from '../../../common/services/db.service';
import { newUserSchema, oldUserSchema } from './request.schema';
import { userResponseSchemas } from './response.schema';

/* ---------- CONTROLLER ---------- */

@Controller('users')
export class UsersController {
  constructor(private readonly dbService: DbService) {}

  @ZodResponse(userResponseSchemas.getAll)
  @UseGuards(AuthGuard({ action: 'read', allowSuperAdmin: true, feature: 'user' }))
  @Get()
  async getAll(): Promise<TypeApiUsers['getAll']['response']> {
    const users = await this.dbService.users.getAll();
    return users;
  }

  @ZodResponse(userResponseSchemas.get)
  @Get('user')
  async get(@Req() req: Request): Promise<TypeApiUsers['get']['response']> {
    const token = req.cookies[cookieNames.accessToken];
    if (!token) throw new UnauthorizedException();

    const tokenData = getTokenData({ purpose: 'access', token });
    if (!tokenData.valid) throw new UnauthorizedException();

    const userId = tokenData.id;

    const user = await this.dbService.users.get({ userId });
    if (!user) throw new UnauthorizedException();

    return user;
  }

  @ZodResponse(userResponseSchemas.create)
  @UseGuards(AuthGuard({ action: 'create', allowSuperAdmin: true, feature: 'user' }))
  @Post()
  async create(
    @Body({ schema: newUserSchema }) body: AssertEqual<z.infer<typeof newUserSchema>, TypeApiUsers['create']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiUsers['create']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.dbService.users.create(body);

    return {};
  }

  @ZodResponse(userResponseSchemas.update)
  @UseGuards(AuthGuard({ action: 'update', allowSuperAdmin: true, feature: 'user' }))
  @Put(':userId')
  async update(
    @Param('userId') userId: TypeUser['id'],
    @Body({ schema: oldUserSchema }) body: AssertEqual<z.infer<typeof oldUserSchema>, TypeApiUsers['update']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiUsers['update']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const currentUser = await this.dbService.users.get({ userId });
    if (!currentUser) throw new BadRequestException();

    await this.dbService.users.update({ roleIds: body.roleIds, updates: body, userId });

    return {};
  }

  @ZodResponse(userResponseSchemas.remove)
  @UseGuards(AuthGuard({ action: 'delete', allowSuperAdmin: true, feature: 'user' }))
  @Delete(':userId')
  async remove(@Param('userId', ParseIntPipe) userId: number, @Req() req: Request): Promise<TypeApiUsers['delete']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const currentUser = await this.dbService.users.get({ userId });
    if (!currentUser) throw new BadRequestException();

    await this.dbService.users.remove({ userId });

    return {};
  }
}
