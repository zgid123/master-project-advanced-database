import { UserEntity, } from '@domain/auth';
import { users } from '#/infrastructure/drizzle/schemas/users';
import { bcryptHash } from '#/infrastructure/security/hash';
import { UserError } from '../../../domain/errors';
export class UserRepository {
    #drizzle;
    constructor(drizzle) {
        this.#drizzle = drizzle;
    }
    async create({ email, roleId, password, }) {
        const { hash } = await bcryptHash({
            source: password,
        });
        const [createdUser] = await this.#drizzle
            .insert(users)
            .values({
            email,
            roleId,
            password: hash,
        })
            .returning()
            .execute();
        if (!createdUser) {
            throw UserError.cannotCreate();
        }
        const role = await this.#drizzle.query.roles.findFirst({
            where: (roles, { eq }) => {
                return eq(roles.id, createdUser.roleId);
            },
        });
        if (!role) {
            throw UserError.cannotCreate();
        }
        return UserEntity.create({
            ...createdUser,
            role,
        });
    }
    async findOne({ email }) {
        const user = await this.findPartialOne({
            email,
        });
        if (!user) {
            throw UserError.notFound();
        }
        return user;
    }
    async findOneById({ id, }) {
        const user = await this.#drizzle.query.users.findFirst({
            where: (users, { eq }) => {
                return eq(users.id, id);
            },
            with: {
                role: true,
            },
        });
        if (!user) {
            throw UserError.notFound();
        }
        return UserEntity.create(user);
    }
    async findPartialOne({ email, }) {
        const user = await this.#drizzle.query.users.findFirst({
            where: (users, { eq }) => {
                return eq(users.email, email);
            },
            with: {
                role: true,
            },
        });
        if (!user) {
            return null;
        }
        return UserEntity.create(user);
    }
}
