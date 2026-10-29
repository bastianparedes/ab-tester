import { TypeRole } from '@ab-tester/constants/types/role';
import type { TypeUser, TypeUserUpdatable } from '@ab-tester/constants/types/user';
import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { getPasswordHashed } from '../../../libs/auth/password';
import db from './postgres/client';
import * as schema from './postgres/schema';

@Injectable()
export class UserRepository {
  get = async ({ userId }: { userId: TypeUser['id'] }): Promise<TypeUser | null> => {
    const result = await db.query.users.findFirst({
      columns: {
        passwordHash: false,
      },
      where: eq(schema.users.id, userId),
      with: {
        userRoles: {
          with: {
            role: {
              with: {
                rolePermissions: {
                  with: {
                    permission: {
                      columns: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!result) return null;

    const { userRoles, ...baseUser } = result;
    const roles = userRoles.map((userRole) => {
      const { rolePermissions, ...baseRole } = userRole.role;
      const permissions = rolePermissions.map((rolePermission) => rolePermission.permission.name);
      return {
        permissions,
        ...baseRole,
      };
    });

    const fullUser = {
      ...baseUser,
      roles,
    };
    return fullUser;
  };

  create = async (data: TypeUserUpdatable & { password: string }) => {
    await db
      .insert(schema.users)
      .values({
        email: data.email,
        name: data.name,
        passwordHash: getPasswordHashed(data.password),
      })
      .returning();
  };

  update = async ({ userId, updates, roleIds }: { userId: TypeUser['id']; updates: TypeUserUpdatable; roleIds: TypeRole['id'][] }) => {
    await db.transaction(async (tx) => {
      await tx.update(schema.users).set(updates).where(eq(schema.users.id, userId));

      const currentRoles = await tx.select({ roleId: schema.userRoles.roleId }).from(schema.userRoles).where(eq(schema.userRoles.userId, userId));
      const currentRoleIds = currentRoles.map((r) => r.roleId);

      const rolesToDelete = currentRoleIds.filter((id) => !roleIds.includes(id));
      const rolesToInsert = roleIds.filter((id) => !currentRoleIds.includes(id));

      if (rolesToDelete.length > 0) {
        await tx.delete(schema.userRoles).where(and(eq(schema.userRoles.userId, userId), inArray(schema.userRoles.roleId, rolesToDelete)));
      }

      if (rolesToInsert.length > 0) {
        await tx.insert(schema.userRoles).values(
          rolesToInsert.map((roleId) => ({
            roleId,
            userId,
          })),
        );
      }
    });
  };

  updatePassword = async ({ userId, newPassword }: { userId: TypeUser['id']; newPassword: string }) => {
    await db
      .update(schema.users)
      .set({
        passwordHash: getPasswordHashed(newPassword),
      })
      .where(eq(schema.users.id, userId));
  };

  getForLogin = async ({ email }: { email: TypeUser['email'] }): Promise<undefined | { id: TypeUser['id']; email: TypeUser['email']; passwordHash: string }> => {
    const user = await db.query.users.findFirst({
      columns: {
        email: true,
        id: true,
        passwordHash: true,
      },
      where: eq(schema.users.email, email),
    });

    return user;
  };

  getAll = async (): Promise<TypeUser[]> => {
    const results = await db.query.users.findMany({
      columns: {
        passwordHash: false,
      },
      with: {
        userRoles: {
          with: {
            role: {
              with: {
                rolePermissions: {
                  with: {
                    permission: {
                      columns: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const users = results.map((result) => {
      const { userRoles, ...baseUser } = result;
      const roles = userRoles.map((userRole) => {
        const { rolePermissions, ...baseRole } = userRole.role;
        const permissions = rolePermissions.map((rolePermission) => rolePermission.permission.name);
        return {
          permissions,
          ...baseRole,
        };
      });

      const fullUser = {
        ...baseUser,
        roles,
      };
      return fullUser;
    });
    return users;
  };

  remove = async ({ userId }: { userId: TypeUser['id'] }) => {
    await db.delete(schema.users).where(eq(schema.users.id, userId));
    await db.delete(schema.userRoles).where(eq(schema.userRoles.userId, userId));
  };
}
