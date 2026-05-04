import { relations } from '@alphacifer/drizzle/core';
import { pgTable, uniqueIndex, uuid } from '@alphacifer/drizzle/pg';

import { baseUuidSchema } from './base';
import { substacks } from './substacks';
import { users } from './users';

export const substacksSubscriptions = pgTable(
  'substacks_subscriptions',
  {
    ...baseUuidSchema,
    substackId: uuid()
      .references(() => substacks.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
    userId: uuid()
      .references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
  },
  (table) => {
    return [
      uniqueIndex('substacks_subscriptions_substack_id_user_id_unique').on(
        table.substackId,
        table.userId,
      ),
    ];
  },
);

export const substacksSubscriptionsRelations = relations(
  substacksSubscriptions,
  ({ one }) => {
    return {
      substack: one(substacks, {
        fields: [substacksSubscriptions.substackId],
        references: [substacks.id],
      }),
      user: one(users, {
        fields: [substacksSubscriptions.userId],
        references: [users.id],
      }),
    };
  },
);

export type TSubstacksSubscription = typeof substacksSubscriptions.$inferSelect;

export type TNewSubstacksSubscription =
  typeof substacksSubscriptions.$inferInsert;
