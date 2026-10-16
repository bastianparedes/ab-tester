import { CanActivate, ExecutionContext, ForbiddenException, Injectable, mixin, Type, UnauthorizedException } from '@nestjs/common';
import { getTokenData } from '../libs/auth/jwt';
import { getStringPermission } from '../libs/auth/permissions';
import { cookieNames } from '../libs/constants';
import { DbService } from '../services/db.service';
import { type Request } from '../types/request';

export function AuthGuard(permissionData: {
  feature: Parameters<typeof getStringPermission>[0]['feature'];
  action: Parameters<typeof getStringPermission>[0]['action'];
}): Type<CanActivate> {
  @Injectable()
  class AuthGuardMixin implements CanActivate {
    constructor(private readonly dbService: DbService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();

      const token = request.cookies[cookieNames.accessToken];

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const tokenData = getTokenData({ purpose: 'access', token });

      if (!tokenData.valid) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const userId = tokenData.id;
      const user = await this.dbService.users.get({ userId });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tenantId = request.params.tenantId ? Number(request.params.tenantId) : null;
      const stringPermission = getStringPermission({ action: permissionData.action, feature: permissionData.feature, tenantId });
      const userHasPermission = user.roles.some((role) => role.permissions.includes(stringPermission));

      if (!userHasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }

      request.user = user;
      return true;
    }
  }

  return mixin(AuthGuardMixin);
}
