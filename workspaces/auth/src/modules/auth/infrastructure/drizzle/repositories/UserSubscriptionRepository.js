import { and, eq } from '@alphacifer/drizzle/core';
import { UserSubscriptionEntity, } from '@domain/auth';
import { usersSubscriptions } from '#/infrastructure/drizzle/schemas/usersSubscriptions';
import { UserError } from '../../../domain/errors';
export class UserSubscriptionRepository {
    #drizzle;
    constructor(drizzle) {
        this.#drizzle = drizzle;
    }
    async create(params) {
        const [createdUserSubscription] = await this.#drizzle
            .insert(usersSubscriptions)
            .values(params)
            .returning()
            .execute();
        if (!createdUserSubscription) {
            throw UserError.cannotCreate();
        }
        return UserSubscriptionEntity.create(createdUserSubscription);
    }
    async delete({ userId, followerId, }) {
        await this.#drizzle
            .delete(usersSubscriptions)
            .where(and(eq(usersSubscriptions.userId, userId), eq(usersSubscriptions.followerId, followerId)))
            .execute();
    }
    async findOne(params) {
        const userSubscription = await this.findPartialOne(params);
        if (!userSubscription) {
            throw UserError.notFound();
        }
        return userSubscription;
    }
    async findPartialOne({ userId, followerId, }) {
        const userSubscription = await this.#drizzle.query.usersSubscriptions.findFirst({
            where: (usersSubscriptions, { and, eq }) => {
                return and(eq(usersSubscriptions.userId, userId), eq(usersSubscriptions.followerId, followerId));
            },
        });
        if (!userSubscription) {
            return null;
        }
        return UserSubscriptionEntity.create(userSubscription);
    }
}
