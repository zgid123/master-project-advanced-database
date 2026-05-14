import { slugify } from '@node/utils';
import { SubstackError } from '../../../../domain/errors';
export class UpdateSubstackCommand {
    #substackRepository;
    constructor(substackRepository) {
        this.#substackRepository = substackRepository;
    }
    async exec({ slug: rawSlug, data, ownerId, }) {
        const slug = rawSlug.toLowerCase();
        const substack = await this.#substackRepository.findOne({
            slug,
        });
        if (substack.ownerId !== ownerId) {
            throw SubstackError.forbidden();
        }
        const newSlug = slugify(data.name);
        if (newSlug !== slug) {
            const existingSubstack = await this.#substackRepository.findPartialOne({
                slug: newSlug,
            });
            if (existingSubstack) {
                throw SubstackError.alreadyExists('name');
            }
        }
        try {
            const updatedSubstack = await this.#substackRepository.update({
                id: substack.id,
                slug,
                data: {
                    name: data.name,
                    description: data.description || null,
                    slug: newSlug,
                },
            });
            return updatedSubstack;
        }
        catch (error) {
            if (error instanceof SubstackError) {
                throw error;
            }
            throw SubstackError.cannotUpdate();
        }
    }
}
