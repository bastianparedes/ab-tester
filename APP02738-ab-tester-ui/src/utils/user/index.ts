import { apiCaller } from '@/libs/restClient';
import { type TypeFullUser } from './helper';

export const getUserFromCookies = async (): Promise<TypeFullUser> => {
  const userResponse = await apiCaller.users.get();
  if (!userResponse.ok)
    return {
      data: null,
      isLogedIn: false,
      permissions: [],
    };

  const user = await userResponse.json();
  const permissions =
    user.roles.reduce((acc, role) => {
      role.permissions.forEach((permission) => {
        if (!acc.includes(permission)) acc.push(permission);
      });
      return acc;
    }, [] as string[]) ?? [];

  return {
    data: user,
    isLogedIn: true,
    permissions: permissions,
  };
};
