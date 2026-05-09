import type { UserSubscriptionEntity } from '../entities';
import type { TCreateUserSubscription } from '../schemas';

export interface IFindOneUserSubscriptionParams {
  userId: string;
  followerId: string;
}

export interface IUserSubscriptionRepository {
  create(params: TCreateUserSubscription): Promise<UserSubscriptionEntity>;
  delete(params: IFindOneUserSubscriptionParams): Promise<void>;
  findOne(
    params: IFindOneUserSubscriptionParams,
  ): Promise<UserSubscriptionEntity>;
  findPartialOne(
    params: IFindOneUserSubscriptionParams,
  ): Promise<UserSubscriptionEntity | null>;
}
