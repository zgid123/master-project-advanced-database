import { relations } from '@alphacifer/drizzle/core';
import { pgTable, uniqueIndex, uuid } from '@alphacifer/drizzle/pg';
import { baseUuidSchema } from '@node/drizzle';
import { users } from './users';
export const usersSubscriptions = pgTable('users_subscriptions', {
    ...baseUuidSchema,
    userId: uuid()
        .references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
    })
        .notNull(),
    followerId: uuid()
        .references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
    })
        .notNull(),
}, (table) => {
    return [
        uniqueIndex('users_subscriptions_user_id_follower_id_unique').on(table.userId, table.followerId),
    ];
});
export const usersSubscriptionsRelations = relations(usersSubscriptions, ({ one }) => {
    return {
        user: one(users, {
            fields: [usersSubscriptions.userId],
            references: [users.id],
            relationName: 'userSubscriptions',
        }),
        follower: one(users, {
            fields: [usersSubscriptions.followerId],
            references: [users.id],
            relationName: 'userFollowers',
        }),
    };
});
