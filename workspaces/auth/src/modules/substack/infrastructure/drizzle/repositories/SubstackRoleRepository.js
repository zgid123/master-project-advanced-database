import { SubstackRoleEntity, } from '@domain/auth';
import { substackRoles } from '#/infrastructure/drizzle/schemas/substackRoles';
import { SubstackError } from '../../../domain/errors';
export class SubstackRoleRepository {
    #drizzle;
    constructor(drizzle) {
        this.#drizzle = drizzle;
    }
    async create(params) {
        const [createdSubstackRole] = await this.#drizzle
            .insert(substackRoles)
            .values(params)
            .returning()
            .execute();
        if (!createdSubstackRole) {
            throw SubstackError.cannotCreate();
        }
        return SubstackRoleEntity.create(createdSubstackRole);
    }
}
