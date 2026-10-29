import type { TypeRole, TypeRoleUpdatable } from '@ab-tester/constants/types/role';
import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import db from './postgres/client';
import * as schema from './postgres/schema';

@Injectable()
export class RoleRepository {
  get = async ({ id }: { id: TypeRole['id'] }): Promise<TypeRole | null> => {
    const result = await db.query.roles.findFirst({
      where: eq(schema.roles.id, id),
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
    });

    if (!result) return null;
    const { rolePermissions, ...baseRole } = result;
    const role = {
      ...baseRole,
      permissions: rolePermissions.map((rp) => rp.permission.name),
    };
    return role;
  };

  create = async (data: TypeRoleUpdatable) => {
    await db.transaction(async (tx) => {
      await tx
        .insert(schema.roles)
        .values({
          description: data.description,
          name: data.name,
        })
        .returning();
    });
  };

  update = async ({ roleId, updates }: { roleId: TypeRole['id']; updates: TypeRoleUpdatable }): Promise<TypeRole> => {
    const currentRole = await this.get({ id: roleId });
    if (!currentRole) throw new Error('Role not found');

    const updatedRole = await db.transaction(async (tx) => {
      const [updatedRole] = await tx
        .update(schema.roles)
        .set({
          description: updates.description,
          name: updates.name,
        })
        .where(eq(schema.roles.id, roleId))
        .returning();

      const oldPermissions = (
        await tx.query.rolePermissions.findMany({
          where: eq(schema.rolePermissions.roleId, roleId),
          with: { permission: true },
        })
      ).map((rp) => rp.permission.name);

      const newPermissions = updates.permissions;
      const removedPermissionsNames = oldPermissions.filter((p) => !newPermissions.includes(p));
      if (removedPermissionsNames.length > 0) {
        const removedPermissions = await tx.select({ id: schema.permissions.id }).from(schema.permissions).where(inArray(schema.permissions.name, removedPermissionsNames));
        if (removedPermissions.length > 0) {
          await tx.delete(schema.rolePermissions).where(
            and(
              eq(schema.rolePermissions.roleId, roleId),
              inArray(
                schema.rolePermissions.permissionId,
                removedPermissions.map((p) => p.id),
              ),
            ),
          );
        }
      }

      const addedPermissionsNames = newPermissions.filter((p) => !oldPermissions.includes(p));
      let permissionsToAttach: { id: number; name: string }[] = [];
      if (addedPermissionsNames.length > 0) {
        const existingPermissions = await tx
          .select({
            id: schema.permissions.id,
            name: schema.permissions.name,
          })
          .from(schema.permissions)
          .where(inArray(schema.permissions.name, addedPermissionsNames));

        const existingNames = existingPermissions.map((p) => p.name);
        const namesToInsert = addedPermissionsNames.filter((name) => !existingNames.includes(name));
        let insertedPermissions: { id: number; name: string }[] = [];
        if (namesToInsert.length > 0) {
          insertedPermissions = await tx
            .insert(schema.permissions)
            .values(namesToInsert.map((name) => ({ name })))
            .returning();
        }
        permissionsToAttach = [...existingPermissions, ...insertedPermissions];
      }

      if (permissionsToAttach.length > 0) {
        await tx.insert(schema.rolePermissions).values(
          permissionsToAttach.map((permission) => ({
            permissionId: permission.id,
            roleId,
          })),
        );
      }

      return updatedRole;
    });

    return {
      ...updatedRole,
      permissions: updates.permissions,
    };
  };
  getAll = async (): Promise<TypeRole[]> => {
    const results = await db.query.roles.findMany({
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
    });

    const roles = results.map((result) => {
      const { rolePermissions, ...baseRole } = result;
      const role = {
        ...baseRole,
        permissions: rolePermissions.map((rp) => rp.permission.name),
      };
      return role;
    });
    return roles;
  };

  remove = async ({ roleId }: { roleId: TypeRole['id'] }) => {
    await db.delete(schema.roles).where(eq(schema.roles.id, roleId));
  };
}
