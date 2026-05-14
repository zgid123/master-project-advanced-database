import { SubstackRoleAssignmentEntity, } from '@domain/auth';
import { substackRoleAssignments } from '#/infrastructure/drizzle/schemas/substackRoleAssignments';
import { SubstackError } from '../../../domain/errors';
export class SubstackRoleAssignmentRepository {
    #drizzle;
    constructor(drizzle) {
        this.#drizzle = drizzle;
    }
    async create(params) {
        const [createdSubstackRoleAssignment] = await this.#drizzle
            .insert(substackRoleAssignments)
            .values(params)
            .returning()
            .execute();
        if (!createdSubstackRoleAssignment) {
            throw SubstackError.cannotCreate();
        }
        return SubstackRoleAssignmentEntity.create(createdSubstackRoleAssignment);
    }
}
