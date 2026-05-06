import { BaseUuid } from '@domain/core';

export const SubstackRole = BaseUuid.and({
  name: 'string',
  substackId: 'string',
});

export const CreateSubstackRole = SubstackRole.pick('name', 'substackId');

export type TSubstackRole = typeof SubstackRole.infer;

export type TCreateSubstackRole = typeof CreateSubstackRole.infer;
