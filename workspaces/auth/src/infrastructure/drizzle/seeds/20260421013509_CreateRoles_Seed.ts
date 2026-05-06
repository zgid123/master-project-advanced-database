import type { TDrizzle } from '../config';
import { roles } from '../schemas/roles';

const DEFAULT_ROLES = [
  {
    name: 'admin',
    displayName: 'Admin',
  },
  {
    name: 'user',
    displayName: 'User',
  },
] as const;

export async function createRoles(drizzle: TDrizzle): Promise<void> {
  await Promise.all(
    DEFAULT_ROLES.map(async (role) => {
      const existingRole = await drizzle.query.roles.findFirst({
        where: (roles, { eq }) => {
          return eq(roles.name, role.name);
        },
      });

      if (existingRole) {
        return;
      }

      await drizzle.insert(roles).values(role).execute();
    }),
  );
}
