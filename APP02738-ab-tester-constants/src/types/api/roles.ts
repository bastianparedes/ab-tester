import type { TypeRole } from '../role';

export type TypeApiRoles = {
  getAll: {
    request: never;
    response: TypeRole[];
  };
  create: {
    request: {
      body: {
        name: string;
        description: string;
        permissions: string[];
      };
    };
    response: Record<string, never>;
  };
  update: {
    request: {
      pathParams: { roleId: TypeRole['id'] };
      body: {
        name: string;
        description: string;
        permissions: string[];
      };
    };
    response: Record<string, never>;
  };
  delete: {
    request: {
      pathParams: { roleId: TypeRole['id'] };
    };
    response: Record<string, never>;
  };
};
