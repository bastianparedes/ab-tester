import { relations } from 'drizzle-orm';
import { integer, pgSchema, primaryKey, serial, varchar } from 'drizzle-orm/pg-core';
import commonConstants from '../../../../../libs/sharedConstants';

export const administrationSchema = pgSchema('administration');

export const statusEnum = administrationSchema.enum('status_enum', commonConstants.arrayStatusArray);

export const tenants = administrationSchema.table('tenants', {
  description: varchar('description', { length: 1024 }).notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const permissions = administrationSchema.table('permissions', {
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).unique().notNull(),
});

export const roles = administrationSchema.table('roles', {
  description: varchar('description', { length: 1024 }).notNull(),
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).unique().notNull(),
});

export const rolePermissions = administrationSchema.table(
  'role_permissions',
  {
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),

    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const users = administrationSchema.table('users', {
  email: varchar('email', { length: 255 }).unique().notNull(),
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  status: statusEnum('status').notNull().default('active'),
});

export const userRoles = administrationSchema.table(
  'user_roles',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.roleId],
    }),
  ],
);

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));
