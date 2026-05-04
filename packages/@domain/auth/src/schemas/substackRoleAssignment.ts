import { BaseUuid } from '@domain/core';

export const SubstackRoleAssignment = BaseUuid.and({
  substackRoleId: 'string',
  userId: 'string',
});

export const CreateSubstackRoleAssignment = SubstackRoleAssignment.pick(
  'substackRoleId',
  'userId',
);

export type TSubstackRoleAssignment = typeof SubstackRoleAssignment.infer;

export type TCreateSubstackRoleAssignment =
  typeof CreateSubstackRoleAssignment.infer;
