import { relations } from '@alphacifer/drizzle/core';
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from '@alphacifer/drizzle/pg';

import { baseUuidSchema } from './base';
import { substackRoles } from './substackRoles';
import { substacksSubscriptions } from './substacksSubscriptions';
import { users } from './users';

export const substacks = pgTable('substacks', {
  ...baseUuidSchema,
  name: varchar().notNull(),
  description: text(),
  slug: varchar().unique().notNull(),
  approved: boolean().notNull().default(false),
  deletedAt: timestamp({
    mode: 'date',
  }),
  ownerId: uuid()
    .references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    })
    .notNull(),
});

export const substacksRelations = relations(substacks, ({ many, one }) => {
  return {
    owner: one(users, {
      fields: [substacks.ownerId],
      references: [users.id],
    }),
    roles: many(substackRoles),
    subscriptions: many(substacksSubscriptions),
  };
});

export type TSubstack = typeof substacks.$inferSelect;

export type TNewSubstack = typeof substacks.$inferInsert;
