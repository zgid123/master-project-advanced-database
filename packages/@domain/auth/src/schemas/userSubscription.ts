import { BaseUuid } from '@domain/core';

export const UserSubscription = BaseUuid.and({
  userId: 'string',
  followerId: 'string',
});

export const CreateUserSubscription = UserSubscription.pick(
  'userId',
  'followerId',
);

export type TUserSubscription = typeof UserSubscription.infer;

export type TCreateUserSubscription = typeof CreateUserSubscription.infer;
