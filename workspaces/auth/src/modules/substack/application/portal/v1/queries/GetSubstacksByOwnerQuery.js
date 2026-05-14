export class GetSubstacksByOwnerQuery {
    #substackRepository;
    constructor(substackRepository) {
        this.#substackRepository = substackRepository;
    }
    async exec({ limit, ownerId, }) {
        return this.#substackRepository.find({
            limit,
            ownerId,
            includeDeleted: false,
        });
    }
}
