import { BaseUuid } from '@domain/core';

export const Role = BaseUuid.and({
  name: 'string',
  displayName: 'string',
});

export const CreateRole = Role.pick('name', 'displayName');

export type TRole = typeof Role.infer;

export type TCreateRole = typeof CreateRole.infer;
