import { compare } from 'bcrypt';
import { AuthError } from '../../../../domain/errors';
export class SignInCommand {
    #userRepository;
    constructor(userRepository) {
        this.#userRepository = userRepository;
    }
    async exec({ email, password }) {
        const user = await this.#userRepository.findOne({
            email,
        });
        if (user.status !== 'active') {
            throw AuthError.invalidCredentials();
        }
        const isPasswordValid = await compare(password, user.password || '');
        if (!isPasswordValid) {
            throw AuthError.invalidCredentials();
        }
        return user;
    }
}
