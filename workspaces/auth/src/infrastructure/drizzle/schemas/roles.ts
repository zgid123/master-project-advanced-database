import { relations } from '@alphacifer/drizzle/core';
import { pgTable, varchar } from '@alphacifer/drizzle/pg';

import { baseUuidSchema } from './base';
import { users } from './users';

export const roles = pgTable('roles', {
  ...baseUuidSchema,
  name: varchar().unique().notNull(),
  displayName: varchar().notNull(),
});

export const rolesRelations = relations(roles, ({ many }) => {
  return {
    users: many(users),
  };
});

export type TRole = typeof roles.$inferSelect;

export type TNewRole = typeof roles.$inferInsert;
