import { relations, type SQL, sql } from '@alphacifer/drizzle/core';
import {
  boolean,
  customType,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from '@alphacifer/drizzle/pg';
import { baseUuidSchema } from '@node/drizzle';

import { substackRoles } from './substackRoles';
import { substacksSubscriptions } from './substacksSubscriptions';
import { users } from './users';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const substacks = pgTable(
  'substacks',
  {
    ...baseUuidSchema,
    name: varchar().unique().notNull(),
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
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      (): SQL =>
        sql`setweight(to_tsvector('english', coalesce(${substacks.name}, '')), 'A') || setweight(to_tsvector('english', coalesce(${substacks.description}, '')), 'B')`,
    ),
  },
  (table) => {
    return {
      searchIndex: index('search_index').using('gin', table.searchVector),
    };
  },
);

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
