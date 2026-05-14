import { addYears } from '@alphacifer/core-utils/dateUtils';
import { nanoid } from 'nanoid';
import { DEFAULT_AUDIENCE, genToken } from '#/infrastructure/security/jwt';
export class SignUserCommand {
    #allowedTokenRepository;
    constructor(allowedTokenRepository) {
        this.#allowedTokenRepository = allowedTokenRepository;
    }
    async exec({ user, aud = DEFAULT_AUDIENCE, }) {
        const { id, email } = user;
        const jti = nanoid(20);
        const authToken = await genToken({
            aud,
            exp: '1h',
            payload: {
                jti,
                sub: email,
            },
        });
        const refreshToken = nanoid(64);
        await this.#allowedTokenRepository.create({
            userId: id,
            refreshToken,
            expiresAt: addYears(new Date(), 1),
        });
        return {
            authToken,
            refreshToken,
        };
    }
}
