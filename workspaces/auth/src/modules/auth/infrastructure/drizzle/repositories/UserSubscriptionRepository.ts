import { and, eq } from '@alphacifer/drizzle/core';
import {
  type IFindOneUserSubscriptionParams,
  type IUserSubscriptionRepository,
  type TCreateUserSubscription,
  UserSubscriptionEntity,
} from '@domain/auth';

import type { TDrizzle } from '#/infrastructure/drizzle/config';
import { usersSubscriptions } from '#/infrastructure/drizzle/schemas/usersSubscriptions';

import { UserError } from '../../../domain/errors';

export class UserSubscriptionRepository implements IUserSubscriptionRepository {
  readonly #drizzle: TDrizzle;

  constructor(drizzle: TDrizzle) {
    this.#drizzle = drizzle;
  }

  public async create(
    params: TCreateUserSubscription,
  ): Promise<UserSubscriptionEntity> {
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

  public async delete({
    userId,
    followerId,
  }: IFindOneUserSubscriptionParams): Promise<void> {
    await this.#drizzle
      .delete(usersSubscriptions)
      .where(
        and(
          eq(usersSubscriptions.userId, userId),
          eq(usersSubscriptions.followerId, followerId),
        ),
      )
      .execute();
  }

  public async findOne(
    params: IFindOneUserSubscriptionParams,
  ): Promise<UserSubscriptionEntity> {
    const userSubscription = await this.findPartialOne(params);

    if (!userSubscription) {
      throw UserError.notFound();
    }

    return userSubscription;
  }

  public async findPartialOne({
    userId,
    followerId,
  }: IFindOneUserSubscriptionParams): Promise<UserSubscriptionEntity | null> {
    const userSubscription =
      await this.#drizzle.query.usersSubscriptions.findFirst({
        where: (usersSubscriptions, { and, eq }) => {
          return and(
            eq(usersSubscriptions.userId, userId),
            eq(usersSubscriptions.followerId, followerId),
          );
        },
      });

    if (!userSubscription) {
      return null;
    }

    return UserSubscriptionEntity.create(userSubscription);
  }
}
