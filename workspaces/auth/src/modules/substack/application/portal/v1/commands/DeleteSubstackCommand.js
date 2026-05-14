import { SubstackError } from '../../../../domain/errors';
export class DeleteSubstackCommand {
    #substackRepository;
    constructor(substackRepository) {
        this.#substackRepository = substackRepository;
    }
    async exec({ slug, ownerId }) {
        const substack = await this.#substackRepository.findOne({
            slug,
        });
        if (substack.ownerId !== ownerId) {
            throw SubstackError.forbidden();
        }
        await this.#substackRepository.delete({
            id: substack.id,
        });
    }
}
