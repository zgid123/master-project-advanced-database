import type { IUserRepository, TSignIn, UserEntity } from '@domain/auth';
import type { ICommand } from '@domain/core';
import { compare } from 'bcrypt';

import { AuthError } from '../../../../domain/errors';

export class SignInCommand implements ICommand<TSignIn, UserEntity> {
  readonly #userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.#userRepository = userRepository;
  }

  public async exec({ email, password }: TSignIn): Promise<UserEntity> {
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
