import { relations } from '@alphacifer/drizzle/core';
import { pgTable, uniqueIndex, uuid, varchar } from '@alphacifer/drizzle/pg';

import { baseUuidSchema } from './base';
import { substackRoleAssignments } from './substackRoleAssignments';
import { substacks } from './substacks';

export const substackRoles = pgTable(
  'substack_roles',
  {
    ...baseUuidSchema,
    name: varchar().notNull(),
    substackId: uuid()
      .references(() => substacks.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      })
      .notNull(),
  },
  (table) => {
    return [
      uniqueIndex('substack_roles_substack_id_name_unique').on(
        table.substackId,
        table.name,
      ),
    ];
  },
);

export const substackRolesRelations = relations(
  substackRoles,
  ({ many, one }) => {
    return {
      substack: one(substacks, {
        fields: [substackRoles.substackId],
        references: [substacks.id],
      }),
      assignments: many(substackRoleAssignments),
    };
  },
);

export type TSubstackRole = typeof substackRoles.$inferSelect;

export type TNewSubstackRole = typeof substackRoles.$inferInsert;
