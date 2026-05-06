import { BaseUuid } from '@domain/core';

export const Substack = BaseUuid.and({
  name: 'string',
  description: 'string | null',
  slug: 'string',
  approved: 'boolean',
  deletedAt: 'Date | null',
  ownerId: 'string',
});

export const CreateSubstack = Substack.pick(
  'name',
  'description',
  'slug',
  'ownerId',
);

export type TSubstack = typeof Substack.infer;

export type TCreateSubstack = typeof CreateSubstack.infer;
