import { bcryptHash } from '../../security/hash';
import type { TDrizzle } from '../config';
import { users } from '../schemas/users';

export async function createUsers(drizzle: TDrizzle): Promise<void> {
  const adminRole = await drizzle.query.roles.findFirst({
    where: (roles, { eq }) => {
      return eq(roles.name, 'admin');
    },
  });

  if (!adminRole) {
    throw new Error('Admin role seed must run before users seed.');
  }

  const admin = await drizzle.query.users.findFirst({
    where: (users, { eq }) => {
      return eq(users.email, process.env.ADMIN_EMAIL);
    },
  });

  if (admin) {
    return;
  }

  const { hash } = await bcryptHash({
    source: process.env.ADMIN_PASSWORD,
  });

  await drizzle
    .insert(users)
    .values({
      roleId: adminRole.id,
      password: hash,
      email: process.env.ADMIN_EMAIL,
    })
    .execute();
}
