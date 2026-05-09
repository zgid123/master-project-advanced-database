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
  delete(params: IFindOneSubstackSubscriptionParams): Promise<void>;
  findOne(
    params: IFindOneSubstackSubscriptionParams,
  ): Promise<SubstackSubscriptionEntity>;
  findPartialOne(
    params: IFindOneSubstackSubscriptionParams,
  ): Promise<SubstackSubscriptionEntity | null>;
}
