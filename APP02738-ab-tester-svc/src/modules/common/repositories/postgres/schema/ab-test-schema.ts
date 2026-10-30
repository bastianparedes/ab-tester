import type { TypeAudience } from '@ab-tester/constants/types/audience';
import type { TypeCampaign } from '@ab-tester/constants/types/campaign';
import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgSchema, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import commonConstants from '../../../../../libs/sharedConstants';
import { statusEnum, tenants, users } from './administration-schema';

export const abTestSchema = pgSchema('ab_test');

export const lifecycleHookOptionEnum = abTestSchema.enum('lifecycle_hook_option_enum', commonConstants.lifecycleHookOptionsArray);

export const trackEvents = abTestSchema.table('track_events', {
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

export const executionGroups = abTestSchema.table('execution_groups', {
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

export const lifecycleHooks = abTestSchema.table('lifecycle_hooks', {
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

export const audiences = abTestSchema.table('audiences', {
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

export const campaigns = abTestSchema.table('campaigns', {
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
