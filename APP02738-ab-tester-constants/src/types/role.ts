export type TypeRole = {
  id: number;
  name: string;
  description: string;
  permissions: string[];
};

export type TypeRoleUpdatable = Pick<TypeRole, 'name' | 'description' | 'permissions'>;
