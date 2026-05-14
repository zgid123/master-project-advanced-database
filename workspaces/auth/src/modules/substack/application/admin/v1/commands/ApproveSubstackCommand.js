export class ApproveSubstackCommand {
    #substackRepository;
    constructor(substackRepository) {
        this.#substackRepository = substackRepository;
    }
    async exec(params) {
        return this.#substackRepository.approve(params);
    }
}
