import type { TDrizzle } from '../config';
import { createRoles } from './20260421013509_CreateRoles_Seed';
import { createUsers } from './20260421013510_CreateUsers_Seed';
import { createSeedUsers } from './20260511000000_CreateSeedUsers_Seed';
import { createSubstacks } from './20260511000001_CreateSubstacks_Seed';

export async function seed(drizzle: TDrizzle): Promise<void> {
  await createRoles(drizzle);
  await createUsers(drizzle);
  await createSeedUsers(drizzle);
  await createSubstacks(drizzle);
}
