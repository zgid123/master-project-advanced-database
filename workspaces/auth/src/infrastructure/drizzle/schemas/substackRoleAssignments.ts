import { relations } from '@alphacifer/drizzle/core';
import { pgTable, uniqueIndex, uuid } from '@alphacifer/drizzle/pg';

import { baseUuidSchema } from './base';
import { substackRoles } from './substackRoles';
import { users } from './users';

export const substackRoleAssignments = pgTable(
  'substack_role_assignments',
  {
    ...baseUuidSchema,
    substackRoleId: uuid()
      .references(() => substackRoles.id, {
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
      uniqueIndex('substack_role_assignments_role_id_user_id_unique').on(
        table.substackRoleId,
        table.userId,
      ),
    ];
  },
);

export const substackRoleAssignmentsRelations = relations(
  substackRoleAssignments,
  ({ one }) => {
    return {
      substackRole: one(substackRoles, {
        fields: [substackRoleAssignments.substackRoleId],
        references: [substackRoles.id],
      }),
      user: one(users, {
        fields: [substackRoleAssignments.userId],
        references: [users.id],
      }),
    };
  },
);

export type TSubstackRoleAssignment =
  typeof substackRoleAssignments.$inferSelect;

export type TNewSubstackRoleAssignment =
  typeof substackRoleAssignments.$inferInsert;
