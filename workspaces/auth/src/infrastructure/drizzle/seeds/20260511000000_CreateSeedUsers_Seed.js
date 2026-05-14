import { bcryptHash } from '../../security/hash';
import { users } from '../schemas/users';
const SEED_USER_COUNT = 100;
const SEED_USER_PASSWORD = 'Password123!';
const FIRST_NAMES = [
    'Alex',
    'Bailey',
    'Casey',
    'Drew',
    'Emery',
    'Finley',
    'Gray',
    'Harper',
    'Jordan',
    'Kai',
];
const LAST_NAMES = [
    'Anderson',
    'Bennett',
    'Carter',
    'Diaz',
    'Ellis',
    'Foster',
    'Garcia',
    'Hayes',
    'Ibrahim',
    'Jones',
];
export async function createSeedUsers(drizzle) {
    const userRole = await drizzle.query.roles.findFirst({
        where: (roles, { eq }) => {
            return eq(roles.name, 'user');
        },
    });
    if (!userRole) {
        throw new Error('User role seed must run before seed users seed.');
    }
    const { hash } = await bcryptHash({
        source: process.env.SEED_USER_PASSWORD ?? SEED_USER_PASSWORD,
    });
    await Promise.all(Array.from({ length: SEED_USER_COUNT }, async (_, index) => {
        const userNumber = index + 1;
        const email = `user${String(userNumber).padStart(3, '0')}@solvit.local`;
        const existingUser = await drizzle.query.users.findFirst({
            where: (users, { eq }) => {
                return eq(users.email, email);
            },
        });
        if (existingUser) {
            return;
        }
        const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
        const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
        await drizzle
            .insert(users)
            .values({
            roleId: userRole.id,
            password: hash,
            email,
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            reputationScore: index * 7,
        })
            .execute();
    }));
}
