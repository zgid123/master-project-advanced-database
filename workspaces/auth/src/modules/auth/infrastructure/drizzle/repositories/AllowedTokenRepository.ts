import {
  AllowedTokenEntity,
  type IAllowedTokenRepository,
  type IFindOneAllowedTokenParams,
  type TCreateAllowedToken,
  UserEntity,
} from '@domain/auth';

import type { TDrizzle } from '#/infrastructure/drizzle/config';
import { allowedTokens } from '#/infrastructure/drizzle/schemas/allowedTokens';

import { TokenError } from '../../../domain/errors';

export class AllowedTokenRepository implements IAllowedTokenRepository {
  #orm: TDrizzle;

  constructor(orm: TDrizzle) {
    this.#orm = orm;
  }

  public async findOne({
    refreshToken,
  }: IFindOneAllowedTokenParams): Promise<AllowedTokenEntity | null> {
    const allowedToken = await this.#orm.query.allowedTokens.findFirst({
      where: (allowedTokens, { eq }) => {
        return eq(allowedTokens.refreshToken, refreshToken);
      },
      with: {
        user: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!allowedToken) {
      return null;
    }

    return AllowedTokenEntity.create({
      ...allowedToken,
      user: UserEntity.create(allowedToken.user),
    });
  }

  public async create(
    params: TCreateAllowedToken,
  ): Promise<AllowedTokenEntity> {
    const [insertedAllowedToken] = await this.#orm
      .insert(allowedTokens)
      .values(params)
      .returning();

    if (!insertedAllowedToken) {
      throw TokenError.cannotCreate();
    }

    const user = await this.#orm.query.users.findFirst({
      where: (users, { eq }) => {
        return eq(users.id, insertedAllowedToken.userId || '');
      },
      with: {
        role: true,
      },
    });

    return AllowedTokenEntity.create({
      ...insertedAllowedToken,
      user: user ? UserEntity.create(user) : null,
    });
  }
}
