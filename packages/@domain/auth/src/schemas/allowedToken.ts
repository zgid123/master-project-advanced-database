import { BaseUuid } from '@domain/core';

export const AllowedToken = BaseUuid.and({
  userId: 'string',
  refreshToken: 'string',
  expiresAt: 'Date | null',
});

export const CreateAllowedToken = AllowedToken.pick(
  'userId',
  'refreshToken',
  'expiresAt',
);

export type TAllowedToken = typeof AllowedToken.infer;

export type TCreateAllowedToken = typeof CreateAllowedToken.infer;
