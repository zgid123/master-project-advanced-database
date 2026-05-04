import type { TSubstackSubscription } from '../schemas';

export type TSubstackSubscriptionEntity = TSubstackSubscription;

export class SubstackSubscriptionEntity implements TSubstackSubscriptionEntity {
  public id: string;
  public userId: string;
  public createdAt: Date;
  public updatedAt: Date;
  public substackId: string;

  constructor({
    id,
    userId,
    createdAt,
    updatedAt,
    substackId,
  }: TSubstackSubscriptionEntity) {
    this.id = id;
    this.userId = userId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.substackId = substackId;
  }

  public static create(
    params: TSubstackSubscriptionEntity,
  ): SubstackSubscriptionEntity {
    return new SubstackSubscriptionEntity(params);
  }
}
