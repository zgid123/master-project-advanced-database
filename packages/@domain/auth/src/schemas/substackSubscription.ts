import { BaseUuid } from '@domain/core';

export const SubstackSubscription = BaseUuid.and({
  substackId: 'string',
  userId: 'string',
});

export const CreateSubstackSubscription = SubstackSubscription.pick(
  'substackId',
  'userId',
);

export type TSubstackSubscription = typeof SubstackSubscription.infer;

export type TCreateSubstackSubscription =
  typeof CreateSubstackSubscription.infer;
