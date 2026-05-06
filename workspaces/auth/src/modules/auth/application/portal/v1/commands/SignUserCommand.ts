import { addYears } from '@alphacifer/core-utils/dateUtils';
import type { IAllowedTokenRepository, UserEntity } from '@domain/auth';
import type { ICommand } from '@domain/core';
import { nanoid } from 'nanoid';

import { DEFAULT_AUDIENCE, genToken } from '#/infrastructure/security/jwt';

interface ISignUserCommandParams {
  user: UserEntity;
  aud?: string | string[];
}

interface ISign {
  authToken: string;
  refreshToken: string;
}

export class SignUserCommand
  implements ICommand<ISignUserCommandParams, ISign>
{
  #allowedTokenRepository: IAllowedTokenRepository;

  constructor(allowedTokenRepository: IAllowedTokenRepository) {
    this.#allowedTokenRepository = allowedTokenRepository;
  }

  public async exec({
    user,
    aud = DEFAULT_AUDIENCE,
  }: ISignUserCommandParams): Promise<ISign> {
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
