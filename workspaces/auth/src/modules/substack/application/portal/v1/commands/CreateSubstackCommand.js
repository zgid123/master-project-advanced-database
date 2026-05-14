import { slugify } from '@node/utils';
import { SubstackError } from '../../../../domain/errors';
const DEFAULT_SUBSTACK_ROLE_NAMES = ['admin', 'moderator'];
export class CreateSubstackCommand {
    #substackRepository;
    #substackRoleRepository;
    #substackRoleAssignmentRepository;
    constructor(substackRepository, substackRoleRepository, substackRoleAssignmentRepository) {
        this.#substackRepository = substackRepository;
        this.#substackRoleRepository = substackRoleRepository;
        this.#substackRoleAssignmentRepository = substackRoleAssignmentRepository;
    }
    async exec({ name, ownerId, description, }) {
        const slug = slugify(name);
        const existingSubstack = await this.#substackRepository.findPartialOne({
            slug,
        });
        if (existingSubstack) {
            throw SubstackError.alreadyExists('name');
        }
        try {
            const substack = await this.#substackRepository.create({
                name,
                slug,
                ownerId,
                description: description ?? null,
            });
            const [adminRole] = await Promise.all(DEFAULT_SUBSTACK_ROLE_NAMES.map((roleName) => {
                return this.#substackRoleRepository.create({
                    name: roleName,
                    substackId: substack.id,
                });
            }));
            if (!adminRole) {
                throw SubstackError.cannotCreate();
            }
            await this.#substackRoleAssignmentRepository.create({
                userId: ownerId,
                substackRoleId: adminRole.id,
            });
            return substack;
        }
        catch {
            throw SubstackError.cannotCreate();
        }
    }
}
