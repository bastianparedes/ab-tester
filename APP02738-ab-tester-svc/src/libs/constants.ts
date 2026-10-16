import { TypeAccessToken, TypeRefreshToken } from '@ab-tester/constants/types/cookies';
import { getStringPermission } from './auth/permissions';

export const cookieNames = {
  accessToken: 'accessToken' satisfies TypeAccessToken,
  refreshToken: 'refreshToken' satisfies TypeRefreshToken,
};
export const superAdminPermissions = [
  getStringPermission({ action: 'create', feature: 'role' }),
  getStringPermission({ action: 'update', feature: 'role' }),
  getStringPermission({ action: 'delete', feature: 'role' }),
  getStringPermission({ action: 'read', feature: 'role' }),
  getStringPermission({ action: 'create', feature: 'user' }),
  getStringPermission({ action: 'update', feature: 'user' }),
  getStringPermission({ action: 'delete', feature: 'user' }),
  getStringPermission({ action: 'read', feature: 'user' }),
];
export const superAdminId = -1;
