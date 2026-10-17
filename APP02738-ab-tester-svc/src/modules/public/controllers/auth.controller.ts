import { TypeApiSessions } from '@ab-tester/constants/types/api/sessions';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { type Response } from 'express';
import { z } from 'zod';
import { generateToken, getTokenData, secondsAccessTokenIsValid, secondsRefreshTokenIsValid } from '../../../libs/auth/jwt';
import { isPasswordCorrect } from '../../../libs/auth/password';
import { cookieNames } from '../../../libs/constants';
import { env } from '../../../libs/env';
import { CacheService } from '../../../services/cache.service';
import { DbService } from '../../../services/db.service';
import { type Request } from '../../../types/request';

export const logInSchema = z
  .object({
    email: z.email(),
    password: z.string(),
  })
  .strip();

@Controller('auth/session')
export class AuthController {
  constructor(
    private readonly dbService: DbService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  async logOut(@Res({ passthrough: true }) res: Response): Promise<TypeApiSessions['logOut']['response']> {
    [cookieNames.accessToken, cookieNames.refreshToken].forEach((cookieName) => {
      res.clearCookie(cookieName, {
        domain: env.DOMAIN,
        httpOnly: true,
        maxAge: -1,
        path: '/',
        sameSite: 'none',
        secure: true,
      });
    });

    return {};
  }

  @Post()
  async logIn(
    @Res({ passthrough: true }) res: Response,
    @Body({ schema: logInSchema }) body: AssertEqual<z.infer<typeof logInSchema>, TypeApiSessions['logIn']['request']['body']>,
  ): Promise<TypeApiSessions['logIn']['response']> {
    const { email, password } = body;
    const user = await this.dbService.users.getForLogin({ email });
    if (!user) throw new UnauthorizedException();

    const passwordIsCorrect = isPasswordCorrect({ password, passwordHash: user.passwordHash });
    if (!passwordIsCorrect) throw new UnauthorizedException();

    const refreshToken = {
      milisecondsDuration: secondsRefreshTokenIsValid * 1000,
      name: cookieNames.refreshToken,
      value: generateToken({ id: user.id, purpose: 'refresh_token' }),
    };
    await this.cacheService.refreshToken.save({ refreshToken: refreshToken.value, userId: user.id });
    const accessToken = {
      milisecondsDuration: secondsAccessTokenIsValid * 1000,
      name: cookieNames.accessToken,
      value: generateToken({ id: user.id, purpose: 'access' }),
    };

    [refreshToken, accessToken].forEach((token) => {
      res.cookie(token.name, token.value, {
        domain: env.DOMAIN,
        httpOnly: true,
        maxAge: token.milisecondsDuration,
        path: '/',
        sameSite: 'none',
        secure: true,
      });
    });
    return {};
  }

  @Get('refresh')
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<TypeApiSessions['refresh']['response']> {
    const oldRefreshToken = req.cookies[cookieNames.refreshToken];
    if (!oldRefreshToken) return {};

    const oldRefreshTokenData = getTokenData({ purpose: 'refresh_token', token: oldRefreshToken });
    if (!oldRefreshTokenData.valid) return {};

    const userId = oldRefreshTokenData.id;

    const refreshTokenInCache = await this.cacheService.refreshToken.get({ userId });
    if (refreshTokenInCache === oldRefreshToken) {
      const newRefreshToken = generateToken({ id: userId, purpose: 'refresh_token' });
      await this.cacheService.refreshToken.save({ refreshToken: newRefreshToken, userId });

      const newAccessToken = generateToken({ id: userId, purpose: 'access' });

      const refreshToken = {
        milisecondsDuration: secondsRefreshTokenIsValid * 1000,
        name: cookieNames.refreshToken,
        value: newRefreshToken,
      };
      const accessToken = {
        milisecondsDuration: secondsAccessTokenIsValid * 1000,
        name: cookieNames.accessToken,
        value: newAccessToken,
      };

      [refreshToken, accessToken].forEach((token) => {
        res.cookie(token.name, token.value, {
          domain: env.DOMAIN,
          httpOnly: true,
          maxAge: token.milisecondsDuration,
          path: '/',
          sameSite: 'none',
          secure: true,
        });
      });
    } else {
      this.cacheService.refreshToken.clear({ userId });
      [cookieNames.accessToken, cookieNames.refreshToken].forEach((cookieName) => {
        res.clearCookie(cookieName, {
          domain: env.DOMAIN,
          httpOnly: true,
          maxAge: -1,
          path: '/',
          sameSite: 'none',
          secure: true,
        });
      });
    }

    return {};
  }
}
