import type { TypeUser } from '@ab-tester/constants/types/user';

export type TypeFullUser =
  | {
      isLogedIn: true;
      data: TypeUser;
      permissions: string[];
    }
  | {
      isLogedIn: false;
      data: null;
      permissions: string[];
    };
