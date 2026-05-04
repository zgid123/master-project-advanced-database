import { BaseUuid } from '@domain/core';
import { type } from 'arktype';

import { Role } from './role';

export const UserStatus = type("'active' | 'inactive' | 'suspended'");

export const User = BaseUuid.and({
  email: 'string.email',
  firstName: 'string | null',
  lastName: 'string | null',
  password: 'string | null',
  displayName: 'string | null',
  roleId: 'string',
  role: Role,
  status: UserStatus,
  reputationScore: 'number',
});

export type TUser = typeof User.infer;

export type TUserStatus = typeof UserStatus.infer;
