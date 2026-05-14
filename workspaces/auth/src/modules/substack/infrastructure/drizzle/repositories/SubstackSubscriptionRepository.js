import { and, eq } from '@alphacifer/drizzle/core';
import { SubstackSubscriptionEntity, } from '@domain/auth';
import { substacksSubscriptions } from '#/infrastructure/drizzle/schemas/substacksSubscriptions';
import { SubstackError } from '../../../domain/errors';
export class SubstackSubscriptionRepository {
    #drizzle;
    constructor(drizzle) {
        this.#drizzle = drizzle;
    }
    async create(params) {
        const [createdSubstackSubscription] = await this.#drizzle
            .insert(substacksSubscriptions)
            .values(params)
            .returning()
            .execute();
        if (!createdSubstackSubscription) {
            throw SubstackError.cannotCreate();
        }
        return SubstackSubscriptionEntity.create(createdSubstackSubscription);
    }
    async delete({ userId, substackId, }) {
        await this.#drizzle
            .delete(substacksSubscriptions)
            .where(and(eq(substacksSubscriptions.substackId, substackId), eq(substacksSubscriptions.userId, userId)))
            .execute();
    }
    async findOne(params) {
        const substackSubscription = await this.findPartialOne(params);
        if (!substackSubscription) {
            throw SubstackError.notFound();
        }
        return substackSubscription;
    }
    async findPartialOne({ userId, substackId, }) {
        const substackSubscription = await this.#drizzle.query.substacksSubscriptions.findFirst({
            where: (substacksSubscriptions, { and, eq }) => {
                return and(eq(substacksSubscriptions.substackId, substackId), eq(substacksSubscriptions.userId, userId));
            },
        });
        if (!substackSubscription) {
            return null;
        }
        return SubstackSubscriptionEntity.create(substackSubscription);
    }
}
