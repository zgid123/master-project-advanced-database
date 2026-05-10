import {
  type ICreateParams,
  type IDrizzle,
  createDrizzle as init,
} from '@alphacifer/drizzle/factory';

import { roles, rolesRelations } from './schemas/roles';
import {
  substackRoleAssignments,
  substackRoleAssignmentsRelations,
} from './schemas/substackRoleAssignments';
import { substackRoles, substackRolesRelations } from './schemas/substackRoles';
import { substacks, substacksRelations } from './schemas/substacks';
import {
  substacksSubscriptions,
  substacksSubscriptionsRelations,
} from './schemas/substacksSubscriptions';
import { users, usersRelations } from './schemas/users';
import {
  usersSubscriptions,
  usersSubscriptionsRelations,
} from './schemas/usersSubscriptions';

export const schema = {
  users,
  roles,
  substacks,
  substackRoles,
  usersRelations,
  rolesRelations,
  usersSubscriptions,
  substacksRelations,
  substacksSubscriptions,
  substackRolesRelations,
  substackRoleAssignments,
  usersSubscriptionsRelations,
  substacksSubscriptionsRelations,
  substackRoleAssignmentsRelations,
} as const;

export type TDrizzle = IDrizzle<typeof schema>;

let cachedDrizzle: TDrizzle | undefined;

export function createDrizzle({
  client,
}: Pick<ICreateParams<typeof schema>, 'client'> = {}): TDrizzle {
  if (cachedDrizzle) {
    return cachedDrizzle;
  }

  cachedDrizzle = init({
    schema,
    client,
    isTest: !!process.env.VITEST_WORKER_ID,
  });

  return cachedDrizzle;
}
