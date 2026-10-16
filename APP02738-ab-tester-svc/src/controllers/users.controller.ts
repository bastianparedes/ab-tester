import { TypeApiUsers } from '@ab-tester/constants/types/api/users';
import { TypeUser } from '@ab-tester/constants/types/user';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../guards/auth.guard';
import { getTokenData } from '../libs/auth/jwt';
import { cookieNames } from '../libs/constants';
import { ZodValidationPipe } from '../pipes/zod';
import { DbService } from '../services/db.service';
import { type Request } from '../types/request';

/* ---------- SCHEMAS ---------- */

const newUserSchema = z
  .object({
    email: z.string(),
    name: z.string(),
    password: z.string(),
  })
  .strip();

const oldUserSchema = z
  .object({
    email: z.string(),
    name: z.string(),
    roleIds: z.array(z.number().int()),
  })
  .strip();

/* ---------- CONTROLLER ---------- */

@Controller('admin/users')
export class UsersController {
  constructor(private readonly dbService: DbService) {}

  @UseGuards(AuthGuard({ action: 'read', feature: 'user' }))
  @Get()
  async getAll(): Promise<TypeApiUsers['getAll']['response']> {
    const users = await this.dbService.users.getAll();
    return users;
  }

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

  @UseGuards(AuthGuard({ action: 'create', feature: 'user' }))
  @Post()
  async create(
    @Body(new ZodValidationPipe(newUserSchema)) body: AssertEqual<z.infer<typeof newUserSchema>, TypeApiUsers['create']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiUsers['create']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.dbService.users.create(body);

    return {};
  }

  @UseGuards(AuthGuard({ action: 'update', feature: 'user' }))
  @Put(':userId')
  async update(
    @Param('userId') userId: TypeUser['id'],
    @Body(new ZodValidationPipe(oldUserSchema)) body: AssertEqual<z.infer<typeof oldUserSchema>, TypeApiUsers['update']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiUsers['update']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const currentUser = await this.dbService.users.get({ userId });
    if (!currentUser) throw new BadRequestException();

    await this.dbService.users.update({ roleIds: body.roleIds, updates: body, userId });

    return {};
  }

  @UseGuards(AuthGuard({ action: 'delete', feature: 'user' }))
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
