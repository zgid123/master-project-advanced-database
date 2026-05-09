import { and, eq } from '@alphacifer/drizzle/core';
import {
  type IFindOneSubstackSubscriptionParams,
  type ISubstackSubscriptionRepository,
  SubstackSubscriptionEntity,
  type TCreateSubstackSubscription,
} from '@domain/auth';

import type { TDrizzle } from '#/infrastructure/drizzle/config';
import { substacksSubscriptions } from '#/infrastructure/drizzle/schemas/substacksSubscriptions';

import { SubstackError } from '../../../domain/errors';

export class SubstackSubscriptionRepository
  implements ISubstackSubscriptionRepository
{
  readonly #drizzle: TDrizzle;

  constructor(drizzle: TDrizzle) {
    this.#drizzle = drizzle;
  }

  public async create(
    params: TCreateSubstackSubscription,
  ): Promise<SubstackSubscriptionEntity> {
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

  public async delete({
    userId,
    substackId,
  }: IFindOneSubstackSubscriptionParams): Promise<void> {
    await this.#drizzle
      .delete(substacksSubscriptions)
      .where(
        and(
          eq(substacksSubscriptions.substackId, substackId),
          eq(substacksSubscriptions.userId, userId),
        ),
      )
      .execute();
  }

  public async findOne(
    params: IFindOneSubstackSubscriptionParams,
  ): Promise<SubstackSubscriptionEntity> {
    const substackSubscription = await this.findPartialOne(params);

    if (!substackSubscription) {
      throw SubstackError.notFound();
    }

    return substackSubscription;
  }

  public async findPartialOne({
    userId,
    substackId,
  }: IFindOneSubstackSubscriptionParams): Promise<SubstackSubscriptionEntity | null> {
    const substackSubscription =
      await this.#drizzle.query.substacksSubscriptions.findFirst({
        where: (substacksSubscriptions, { and, eq }) => {
          return and(
            eq(substacksSubscriptions.substackId, substackId),
            eq(substacksSubscriptions.userId, userId),
          );
        },
      });

    if (!substackSubscription) {
      return null;
    }

    return SubstackSubscriptionEntity.create(substackSubscription);
  }
}
