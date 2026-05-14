export class GetSubstacksQuery {
    #substackRepository;
    constructor(substackRepository) {
        this.#substackRepository = substackRepository;
    }
    async exec({ limit, } = {}) {
        return this.#substackRepository.find({
            limit,
            approved: true,
        });
    }
}
