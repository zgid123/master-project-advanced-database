import { AuthError } from '../../../../domain/errors';
export class GetUserQuery {
    #userRepository;
    constructor(userRepository) {
        this.#userRepository = userRepository;
    }
    async exec({ email }) {
        const user = await this.#userRepository.findOne({
            email,
        });
        if (user.status !== 'active') {
            throw AuthError.unauthorized();
        }
        return user;
    }
}
