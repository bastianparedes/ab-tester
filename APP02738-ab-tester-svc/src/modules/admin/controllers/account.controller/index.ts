import { TypeApiUsers } from '@ab-tester/constants/types/api/users';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, Put, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { isPasswordCorrect } from '../../../../libs/auth/password';
import { type Request } from '../../../../types/request';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodResponse } from '../../../common/interceptors/zod-response.interceptor';
import { DbService } from '../../../common/services/db.service';
import { accountSchema, changePasswordSchema } from './request.schema';
import { accountResponseSchemas } from './response.schema';

/* ---------- CONTROLLER ---------- */

@Controller('account')
export class AccountController {
  constructor(private readonly dbService: DbService) {}
  @ZodResponse(accountResponseSchemas.updatePassword)
  @UseGuards(AuthGuard({ action: 'update', feature: 'user' }))
  @Put('update-password')
  async updatePassword(
    @Body({ schema: changePasswordSchema }) body: AssertEqual<z.infer<typeof changePasswordSchema>, TypeApiUsers['updatePassword']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiUsers['updatePassword']['response']> {
    const reqUser = req.user;
    if (!reqUser) throw new UnauthorizedException();

    const user = await this.dbService.users.getForLogin({ email: reqUser.email });
    if (!user) throw new UnauthorizedException();

    const passwordIsCorrect = isPasswordCorrect({ password: body.oldPassword, passwordHash: user.passwordHash });
    if (!passwordIsCorrect) throw new UnauthorizedException();

    await this.dbService.users.updatePassword({ newPassword: body.newPassword, userId: user.id });
    return {};
  }

  @ZodResponse(accountResponseSchemas.updateAccount)
  @UseGuards(AuthGuard({ action: 'update', feature: 'user' }))
  @Put('update-account')
  async updateAccount(
    @Body({ schema: accountSchema }) body: AssertEqual<z.infer<typeof accountSchema>, TypeApiUsers['updateAccount']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiUsers['updateAccount']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const roleIds = user.roles.map((role) => role.id);

    await this.dbService.users.update({ roleIds, updates: body, userId: user.id });
    return {};
  }
}
