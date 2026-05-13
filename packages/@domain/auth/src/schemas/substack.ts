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

export const NewSubstack = Substack.pick('name', 'description');

export const UpdateSubstack = Substack.pick('name', 'description', 'slug');

export type TSubstack = typeof Substack.infer;

export type TCreateSubstack = typeof CreateSubstack.infer;

export type TNewSubstack = typeof NewSubstack.infer;

export type TUpdateSubstack = typeof UpdateSubstack.infer;
