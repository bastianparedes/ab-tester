import { createTableRelationsHelpers, extractTablesRelationalConfig } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import * as schema from '../schema';

describe('PostgreSQL schema', () => {
  it('builds relation metadata for all relational tables', () => {
    const { tables } = extractTablesRelationalConfig(schema, createTableRelationsHelpers);

    expect(Object.keys(tables)).toContain('campaigns');
    expect(Object.keys(tables)).toContain('users');
    expect(Object.keys(tables.campaigns.relations)).toHaveLength(2);
    expect(Object.keys(tables.users.relations)).toHaveLength(1);
  });

  it('evaluates automatic timestamp update callbacks', () => {
    const tables = [schema.trackEvents, schema.executionGroups, schema.lifecycleHooks, schema.audiences, schema.campaigns];
    const updateCallbacks = tables.flatMap((table) =>
      getTableConfig(table)
        .columns.map((column) => column.onUpdateFn)
        .filter(Boolean),
    );

    expect(updateCallbacks).toHaveLength(5);
    for (const callback of updateCallbacks) expect(callback?.()).toBeInstanceOf(Date);
  });

  it('resolves every declared foreign-key reference', () => {
    const tables = [
      schema.tenants,
      schema.trackEvents,
      schema.executionGroups,
      schema.lifecycleHooks,
      schema.audiences,
      schema.campaigns,
      schema.permissions,
      schema.roles,
      schema.rolePermissions,
      schema.users,
      schema.userRoles,
    ];
    const foreignKeys = tables.flatMap((table) => getTableConfig(table).foreignKeys);

    expect(foreignKeys.length).toBeGreaterThan(0);
    for (const foreignKey of foreignKeys) {
      expect(foreignKey.reference().foreignColumns).toHaveLength(1);
    }
  });
});
