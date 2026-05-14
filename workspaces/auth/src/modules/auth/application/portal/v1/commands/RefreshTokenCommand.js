export class RefreshTokenCommand {
    #allowedTokenRepository;
    constructor(allowedTokenRepository) {
        this.#allowedTokenRepository = allowedTokenRepository;
    }
    async exec({ refreshToken, }) {
        const allowedToken = await this.#allowedTokenRepository.findOne({
            refreshToken,
        });
        if (!allowedToken?.user) {
            return null;
        }
        if (allowedToken.isExpired) {
            return null;
        }
        return allowedToken.user;
    }
}
