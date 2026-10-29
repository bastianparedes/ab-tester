import type { TypeAudience } from '@ab-tester/constants/types/audience';
import type { TypeCampaign } from '@ab-tester/constants/types/campaign';
import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgEnum, pgTable, primaryKey, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import commonConstants from '../../../../libs/sharedConstants';

export const statusEnum = pgEnum('status_enum', commonConstants.arrayStatusArray);
export const lifecycleHookOptionEnum = pgEnum('lifecycle_hook_option_enum', commonConstants.lifecycleHookOptionsArray);

// TENANTS
export const tenants = pgTable('tenants', {
  description: varchar('description', { length: 1024 }).notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});

// TRACK EVENTS
export const trackEvents = pgTable('track_events', {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  id: serial('id').primaryKey().unique().notNull(),
  javascript: text('get_data').notNull(),
  multipleTimes: boolean('multiple_times').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  status: statusEnum('status').notNull().default('inactive'),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
});

// EXECUTION GROUPS
export const executionGroups = pgTable('execution_groups', {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  onlyCampaignsPreviouslyExecuted: boolean('only_campaigns_previously_executed').notNull(),
  onlyOneCampaignPerPageLoad: boolean('only_one_campaign_per_page_load').notNull(),
  status: statusEnum('status').notNull().default('inactive'),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => tenants.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  waitForEveryCampaignToBeEvaluated: boolean('wait_for_every_campaign_to_be_evaluated').notNull(),
});

// LIFECYCLE HOOKS
export const lifecycleHooks = pgTable('lifecycle_hooks', {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  id: serial('id').primaryKey().unique().notNull(),
  javascript: text('javascript').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  option: lifecycleHookOptionEnum('option').notNull(),
  status: statusEnum('status').notNull().default('inactive'),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// AUDIENCES
export const audiences = pgTable('audiences', {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).notNull().default(''),
  requirements: jsonb('requirements').$type<TypeAudience['requirements']>().notNull(),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
});

// CAMPAIGNS
export const campaigns = pgTable('campaigns', {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  executionGroupId: integer('execution_group_id').references(() => executionGroups.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).notNull().default(''),
  requirements: jsonb('requirements').$type<TypeCampaign['requirements']>().notNull(),
  status: statusEnum('status').notNull().default('inactive'),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  triggers: jsonb('triggers').$type<TypeCampaign['triggers']>().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  variations: jsonb('variations').$type<TypeCampaign['variations']>().notNull(),
});

// PERMISSIONS
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).unique().notNull(),
});

// ROLES
export const roles = pgTable('roles', {
  description: varchar('description', { length: 1024 }).notNull(),
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).unique().notNull(),
});

// ROLE_PERMISSIONS
export const rolePermissions = pgTable(
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

// USERS
export const users = pgTable('users', {
  email: varchar('email', { length: 255 }).unique().notNull(),
  id: serial('id').primaryKey().unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  status: statusEnum('status').notNull().default('active'),
});

// USER_ROLES
export const userRoles = pgTable(
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

// -------------------- RELATIONS --------------------

export const tenantsRelations = relations(tenants, ({ many }) => ({
  campaigns: many(campaigns),
}));

export const lifecycleHooksRelations = relations(lifecycleHooks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [lifecycleHooks.tenantId],
    references: [tenants.id],
  }),
}));

export const executionGroupsRelations = relations(executionGroups, ({ one, many }) => ({
  campaigns: many(campaigns),
  tenant: one(tenants, {
    fields: [executionGroups.tenantId],
    references: [tenants.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  executionGroup: one(executionGroups, {
    fields: [campaigns.executionGroupId],
    references: [executionGroups.id],
  }),
  tenant: one(tenants, {
    fields: [campaigns.tenantId],
    references: [tenants.id],
  }),
}));

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
