import type {
  IRoleRepository,
  IUserRepository,
  TSignUp,
  UserEntity,
} from '@domain/auth';
import type { ICommand } from '@domain/core';

import { bcryptHash } from '#/infrastructure/security/hash';

import { UserError } from '../../../../domain/errors';

export class SignUpCommand implements ICommand<TSignUp, UserEntity> {
  readonly #roleRepository: IRoleRepository;
  readonly #userRepository: IUserRepository;

  constructor(
    userRepository: IUserRepository,
    roleRepository: IRoleRepository,
  ) {
    this.#roleRepository = roleRepository;
    this.#userRepository = userRepository;
  }

  public async exec({ email, password }: TSignUp): Promise<UserEntity> {
    const existingUser = await this.#userRepository.findPartialOne({
      email,
    });

    if (existingUser) {
      throw UserError.alreadyExists('email');
    }

    const userRole = await this.#roleRepository.findOne({
      name: 'user',
    });

    const { hash } = await bcryptHash({
      source: password,
    });

    try {
      const user = await this.#userRepository.create({
        email,
        password: hash,
        roleId: userRole.id,
      });

      return user;
    } catch {
      throw UserError.cannotCreate();
    }
  }
}
