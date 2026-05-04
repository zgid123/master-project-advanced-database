import type { SubstackSubscriptionEntity } from '../entities';
import type { TCreateSubstackSubscription } from '../schemas';

export interface IFindOneSubstackSubscriptionParams {
  userId: string;
  substackId: string;
}

export interface ISubstackSubscriptionRepository {
  create(
    params: TCreateSubstackSubscription,
  ): Promise<SubstackSubscriptionEntity>;
  findOne(
    params: IFindOneSubstackSubscriptionParams,
  ): Promise<SubstackSubscriptionEntity>;
  findOneOrNull(
    params: IFindOneSubstackSubscriptionParams,
  ): Promise<SubstackSubscriptionEntity | null>;
}
