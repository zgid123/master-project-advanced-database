import {
  AllowedTokenEntity,
  type IAllowedTokenRepository,
  type IFindOneAllowedTokenParams,
  type IUserRepository,
  type TCreateAllowedToken,
} from '@domain/auth';
import { nanoid } from 'nanoid';

import { getRedis } from '#/infrastructure/redis/instance';

import { TokenError } from '../../../domain/errors';

interface IRedisAllowedToken {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  refreshToken: string;
}

const REFRESH_TOKEN_KEY_PREFIX = 'refresh_token';

function createRefreshTokenKey(refreshToken: string): string {
  return `${REFRESH_TOKEN_KEY_PREFIX}:${refreshToken}`;
}

function getExpiresInSeconds(expiresAt: Date | null): number | null {
  if (!expiresAt) {
    return null;
  }

  return Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
}

export class AllowedTokenRepository implements IAllowedTokenRepository {
  readonly #userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.#userRepository = userRepository;
  }

  public async findOne({
    refreshToken,
  }: IFindOneAllowedTokenParams): Promise<AllowedTokenEntity | null> {
    const redis = await getRedis();
    const data = await redis.get(createRefreshTokenKey(refreshToken));

    if (!data) {
      return null;
    }

    const allowedToken = JSON.parse(data) as IRedisAllowedToken;
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
    } catch {
      return null;
    }
  }

  public async create({
    userId,
    expiresAt,
    refreshToken,
  }: TCreateAllowedToken): Promise<AllowedTokenEntity> {
    const redis = await getRedis();
    const now = new Date();
    const expiresInSeconds = getExpiresInSeconds(expiresAt);

    if (expiresInSeconds !== null && expiresInSeconds <= 0) {
      throw TokenError.cannotCreate();
    }

    const allowedToken: IRedisAllowedToken = {
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
    } else {
      await redis.set(
        key,
        JSON.stringify(allowedToken),
        'EX',
        expiresInSeconds,
      );
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
}
