import type { TypeRole } from './role';
import type { TypeStatus } from './constants';

export type TypeUser = {
  id: number;
  name: string;
  email: string;
  roles: TypeRole[];
  status: TypeStatus;
};

export type TypeUserCreatable = Pick<TypeUser, 'name' | 'email'>;

export type TypeUserUpdatable = Pick<TypeUser, 'name' | 'email' | 'status'>;
