import { TypeAccessToken, TypeRefreshToken } from '@ab-tester/constants/types/cookies';
import { getStringPermission } from './auth/permissions';

export const cookieNames = {
  accessToken: 'accessToken' satisfies TypeAccessToken,
  refreshToken: 'refreshToken' satisfies TypeRefreshToken,
};
export const superAdminPermissions = [];
export const superAdminId = -1;
