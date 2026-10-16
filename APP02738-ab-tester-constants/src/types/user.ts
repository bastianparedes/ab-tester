import type { TypeRole } from './role';

export type TypeUser = {
  id: number;
  name: string;
  email: string;
  roles: TypeRole[];
};

export type TypeUserUpdatable = Pick<TypeUser, 'name' | 'email'>;
