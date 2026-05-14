export class GetTotalSubstacksQuery {
    #substackRepository;
    constructor(substackRepository) {
        this.#substackRepository = substackRepository;
    }
    async exec() {
        return this.#substackRepository.count({
            approved: true,
        });
    }
}
