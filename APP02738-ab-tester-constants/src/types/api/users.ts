import type { TypeRole } from '../role';
import type { TypeUser } from '../user';

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
        name: TypeUser['name'];
        email: TypeUser['email'];
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
