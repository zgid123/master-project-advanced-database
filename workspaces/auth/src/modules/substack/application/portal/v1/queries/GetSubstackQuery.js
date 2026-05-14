export class GetSubstackQuery {
    #substackRepository;
    constructor(substackRepository) {
        this.#substackRepository = substackRepository;
    }
    async exec({ slug, }) {
        return this.#substackRepository.findOne({
            slug,
            approved: true,
        });
    }
}
