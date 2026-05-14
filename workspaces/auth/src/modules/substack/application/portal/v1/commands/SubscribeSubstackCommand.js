export class SubscribeSubstackCommand {
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
        const existingSubscription = await this.#substackSubscriptionRepository.findPartialOne({
            userId,
            substackId: substack.id,
        });
        if (existingSubscription) {
            return {
                substack,
                created: false,
                subscription: existingSubscription,
            };
        }
        const subscription = await this.#substackSubscriptionRepository.create({
            userId,
            substackId: substack.id,
        });
        return {
            substack,
            subscription,
            created: true,
        };
    }
}
