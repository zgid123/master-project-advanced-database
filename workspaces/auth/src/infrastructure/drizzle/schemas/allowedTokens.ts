import { relations } from '@alphacifer/drizzle/core';
import { date, pgTable, text, uuid } from '@alphacifer/drizzle/pg';

import { baseUuidSchema } from './base';
import { users } from './users';

export const allowedTokens = pgTable('allowed_tokens', {
  ...baseUuidSchema,
  refreshToken: text().notNull(),
  expiresAt: date({
    mode: 'date',
  }),
  userId: uuid()
    .references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    })
    .notNull(),
});

export const allowedTokensRelations = relations(allowedTokens, ({ one }) => {
  return {
    user: one(users, {
      fields: [allowedTokens.userId],
      references: [users.id],
    }),
  };
});

export type TAllowedToken = typeof allowedTokens.$inferSelect;

export type TNewAllowedToken = typeof allowedTokens.$inferInsert;
