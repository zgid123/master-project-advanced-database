import type { TUserSubscription } from '../schemas';

export type TUserSubscriptionEntity = TUserSubscription;

export class UserSubscriptionEntity implements TUserSubscriptionEntity {
  public id: string;
  public userId: string;
  public createdAt: Date;
  public updatedAt: Date;
  public followerId: string;

  constructor({
    id,
    userId,
    createdAt,
    updatedAt,
    followerId,
  }: TUserSubscriptionEntity) {
    this.id = id;
    this.userId = userId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.followerId = followerId;
  }

  public static create(
    params: TUserSubscriptionEntity,
  ): UserSubscriptionEntity {
    return new UserSubscriptionEntity(params);
  }
}
