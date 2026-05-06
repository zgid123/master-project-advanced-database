import type { TDrizzle } from '../config';
import { createRoles } from './20260421013509_CreateRoles_Seed';
import { createUsers } from './20260421013510_CreateUsers_Seed';

export async function seed(drizzle: TDrizzle): Promise<void> {
  await createRoles(drizzle);
  await createUsers(drizzle);
}
