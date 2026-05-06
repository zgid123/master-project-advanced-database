import type { IUserRepository, UserEntity } from '@domain/auth';
import type { IQuery } from '@domain/core';

import { AuthError } from '../../../../domain/errors';

interface IGetUserQueryParams {
  email: string;
}

export class GetUserQuery implements IQuery<IGetUserQueryParams, UserEntity> {
  readonly #userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.#userRepository = userRepository;
  }

  public async exec({ email }: IGetUserQueryParams): Promise<UserEntity> {
    const user = await this.#userRepository.findOne({
      email,
    });

    if (user.status !== 'active') {
      throw AuthError.unauthorized();
    }

    return user;
  }
}
