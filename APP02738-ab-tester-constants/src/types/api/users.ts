import type { TypeRole } from '../role';
import type { TypeUser, TypeUserCreatable } from '../user';

export type TypeApiUsers = {
  getAll: {
    request: never;
    response: TypeUser[];
  };
  get: {
    request: never;
    response: TypeUser;
  };
  create: {
    request: {
      body: {
        name: TypeUserCreatable['name'];
        email: TypeUserCreatable['email'];
        password: string;
      };
    };
    response: Record<string, never>;
  };
  update: {
    request: {
      pathParams: { userId: TypeUser['id'] };
      body: {
        name: TypeUser['name'];
        email: TypeUser['email'];
        roleIds: TypeRole['id'][];
        status: TypeUser['status'];
      };
    };
    response: Record<string, never>;
  };
  resetPassword: {
    request: {
      pathParams: { userId: TypeUser['id'] };
      body: {
        newPassword: string;
      };
    };
    response: Record<string, never>;
  };
  delete: {
    request: {
      pathParams: { userId: TypeUser['id'] };
    };
    response: Record<string, never>;
  };
  updatePassword: {
    request: {
      body: {
        oldPassword: string;
        newPassword: string;
      };
    };
    response: Record<string, never>;
  };
  updateAccount: {
    request: {
      body: {
        name: TypeUser['name'];
        email: TypeUser['email'];
      };
    };
    response: Record<string, never>;
  };
};
