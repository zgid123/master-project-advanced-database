import { RoleError } from '../../../domain/errors';
export class RoleRepository {
    #drizzle;
    constructor(drizzle) {
        this.#drizzle = drizzle;
    }
    async findOne({ name }) {
        const role = await this.#drizzle.query.roles.findFirst({
            where: (roles, { eq }) => {
                return eq(roles.name, name);
            },
        });
        if (!role) {
            throw RoleError.notFound();
        }
        return role;
    }
}
