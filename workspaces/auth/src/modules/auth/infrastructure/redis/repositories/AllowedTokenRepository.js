import { AllowedTokenEntity, } from '@domain/auth';
import { nanoid } from 'nanoid';
import { getRedis } from '#/infrastructure/redis/instance';
import { TokenError } from '../../../domain/errors';
const REFRESH_TOKEN_KEY_PREFIX = 'refresh_token';
function createRefreshTokenKey(refreshToken) {
    return `${REFRESH_TOKEN_KEY_PREFIX}:${refreshToken}`;
}
function getExpiresInSeconds(expiresAt) {
    if (!expiresAt) {
        return null;
    }
    return Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
}
export class AllowedTokenRepository {
    #userRepository;
    constructor(userRepository) {
        this.#userRepository = userRepository;
    }
    async findOne({ refreshToken, }) {
        const redis = await getRedis();
        const data = await redis.get(createRefreshTokenKey(refreshToken));
        if (!data) {
            return null;
        }
        const allowedToken = JSON.parse(data);
        const expiresAt = allowedToken.expiresAt
            ? new Date(allowedToken.expiresAt)
            : null;
        if (expiresAt && expiresAt < new Date()) {
            await redis.del(createRefreshTokenKey(refreshToken));
            return null;
        }
        try {
            const user = await this.#userRepository.findOneById({
                id: allowedToken.userId,
            });
            return AllowedTokenEntity.create({
                user,
                expiresAt,
                id: allowedToken.id,
                refreshToken: allowedToken.refreshToken,
                createdAt: new Date(allowedToken.createdAt),
                updatedAt: new Date(allowedToken.updatedAt),
            });
        }
        catch {
            return null;
        }
    }
    async create({ userId, expiresAt, refreshToken, }) {
        const redis = await getRedis();
        const now = new Date();
        const expiresInSeconds = getExpiresInSeconds(expiresAt);
        if (expiresInSeconds !== null && expiresInSeconds <= 0) {
            throw TokenError.cannotCreate();
        }
        const allowedToken = {
            userId,
            refreshToken,
            id: nanoid(20),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            expiresAt: expiresAt?.toISOString() ?? null,
        };
        const key = createRefreshTokenKey(refreshToken);
        if (expiresInSeconds === null) {
            await redis.set(key, JSON.stringify(allowedToken));
        }
        else {
            await redis.set(key, JSON.stringify(allowedToken), 'EX', expiresInSeconds);
        }
        const user = await this.#userRepository.findOneById({
            id: userId,
        });
        return AllowedTokenEntity.create({
            user,
            expiresAt,
            refreshToken,
            createdAt: now,
            updatedAt: now,
            id: allowedToken.id,
        });
    }
    async delete({ refreshToken, }) {
        const redis = await getRedis();
        await redis.del(createRefreshTokenKey(refreshToken));
    }
}
