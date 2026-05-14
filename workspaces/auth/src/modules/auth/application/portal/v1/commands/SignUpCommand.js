import { UserError } from '../../../../domain/errors';
export class SignUpCommand {
    #roleRepository;
    #userRepository;
    constructor(userRepository, roleRepository) {
        this.#roleRepository = roleRepository;
        this.#userRepository = userRepository;
    }
    async exec({ email, password }) {
        const existingUser = await this.#userRepository.findPartialOne({
            email,
        });
        if (existingUser) {
            throw UserError.alreadyExists('email');
        }
        const userRole = await this.#roleRepository.findOne({
            name: 'user',
        });
        try {
            const user = await this.#userRepository.create({
                email,
                password,
                roleId: userRole.id,
            });
            return user;
        }
        catch {
            throw UserError.cannotCreate();
        }
    }
}
