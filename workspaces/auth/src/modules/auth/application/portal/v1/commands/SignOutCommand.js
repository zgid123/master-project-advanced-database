export class SignOutCommand {
    #allowedTokenRepository;
    constructor(allowedTokenRepository) {
        this.#allowedTokenRepository = allowedTokenRepository;
    }
    async exec({ refreshToken }) {
        await this.#allowedTokenRepository.delete({
            refreshToken,
        });
    }
}
