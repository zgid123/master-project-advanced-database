export class UnsubscribeSubstackCommand {
    #substackRepository;
    #substackSubscriptionRepository;
    constructor(substackRepository, substackSubscriptionRepository) {
        this.#substackRepository = substackRepository;
        this.#substackSubscriptionRepository = substackSubscriptionRepository;
    }
    async exec({ slug, userId, }) {
        const substack = await this.#substackRepository.findOne({
            slug,
            approved: true,
        });
        await this.#substackSubscriptionRepository.delete({
            userId,
            substackId: substack.id,
        });
    }
}
