import { BaseUuid } from '@domain/core';

export const Role = BaseUuid.and({
  name: 'string',
  displayName: 'string',
});

export type TRole = typeof Role.infer;
