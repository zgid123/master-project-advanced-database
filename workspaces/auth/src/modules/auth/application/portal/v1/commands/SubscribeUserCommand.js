import { UserError } from '../../../../domain/errors';
export class SubscribeUserCommand {
    #userRepository;
    #userSubscriptionRepository;
    constructor(userRepository, userSubscriptionRepository) {
        this.#userRepository = userRepository;
        this.#userSubscriptionRepository = userSubscriptionRepository;
    }
    async exec({ userId, followerId, }) {
        if (userId === followerId) {
            throw UserError.invalidParams('id');
        }
        const user = await this.#userRepository.findOneById({
            id: userId,
        });
        const existingSubscription = await this.#userSubscriptionRepository.findPartialOne({
            userId,
            followerId,
        });
        if (existingSubscription) {
            return {
                user,
                created: false,
            };
        }
        await this.#userSubscriptionRepository.create({
            userId,
            followerId,
        });
        return {
            user,
            created: true,
        };
    }
}
