import { type } from 'arktype';

export const BaseUuid = type({
  id: 'string',
  createdAt: 'Date',
  updatedAt: 'Date',
});

export type TBaseUuid = typeof BaseUuid.infer;
