import { relations } from '@alphacifer/drizzle/core';
import { integer, pgTable, text, uuid, varchar } from '@alphacifer/drizzle/pg';
import { baseUuidSchema } from '@node/drizzle';

import { roles } from './roles';
import { substackRoleAssignments } from './substackRoleAssignments';
import { substacks } from './substacks';
import { substacksSubscriptions } from './substacksSubscriptions';
import { usersSubscriptions } from './usersSubscriptions';

export type TUserStatus = 'active' | 'inactive' | 'suspended';

export const users = pgTable('users', {
  ...baseUuidSchema,
  firstName: varchar(),
  lastName: varchar(),
  email: varchar().unique().notNull(),
  password: text(),
  displayName: varchar(),
  roleId: uuid()
    .references(() => roles.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    })
    .notNull(),
  status: varchar().notNull().$type<TUserStatus>().default('active'),
  reputationScore: integer().notNull().default(0),
});

export const usersRelations = relations(users, ({ many, one }) => {
  return {
    role: one(roles, {
      fields: [users.roleId],
      references: [roles.id],
    }),
    ownedSubstacks: many(substacks),
    substackSubscriptions: many(substacksSubscriptions),
    substackRoleAssignments: many(substackRoleAssignments),
    subscriptions: many(usersSubscriptions, {
      relationName: 'userSubscriptions',
    }),
    followers: many(usersSubscriptions, {
      relationName: 'userFollowers',
    }),
  };
});

export type TUser = typeof users.$inferSelect;

export type TNewUser = typeof users.$inferInsert;
