import { relations } from '@alphacifer/drizzle/core';
import { pgTable, varchar } from '@alphacifer/drizzle/pg';
import { baseUuidSchema } from '@node/drizzle';
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
