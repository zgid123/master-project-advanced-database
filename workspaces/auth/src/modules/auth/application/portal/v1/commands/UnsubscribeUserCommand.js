export class UnsubscribeUserCommand {
    #userRepository;
    #userSubscriptionRepository;
    constructor(userRepository, userSubscriptionRepository) {
        this.#userRepository = userRepository;
        this.#userSubscriptionRepository = userSubscriptionRepository;
    }
    async exec({ userId, followerId, }) {
        await this.#userRepository.findOneById({
            id: userId,
        });
        await this.#userSubscriptionRepository.delete({
            userId,
            followerId,
        });
    }
}
