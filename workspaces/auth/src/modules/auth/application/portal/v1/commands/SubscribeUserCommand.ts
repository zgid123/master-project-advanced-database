import type {
  IUserRepository,
  IUserSubscriptionRepository,
  UserEntity,
} from '@domain/auth';
import type { ICommand } from '@domain/core';

import { UserError } from '../../../../domain/errors';

interface ISubscribeUserCommandParams {
  userId: string;
  followerId: string;
}

interface ISubscribeUserCommandResult {
  created: boolean;
  user: UserEntity;
}

export class SubscribeUserCommand
  implements ICommand<ISubscribeUserCommandParams, ISubscribeUserCommandResult>
{
  readonly #userRepository: IUserRepository;
  readonly #userSubscriptionRepository: IUserSubscriptionRepository;

  constructor(
    userRepository: IUserRepository,
    userSubscriptionRepository: IUserSubscriptionRepository,
  ) {
    this.#userRepository = userRepository;
    this.#userSubscriptionRepository = userSubscriptionRepository;
  }

  public async exec({
    userId,
    followerId,
  }: ISubscribeUserCommandParams): Promise<ISubscribeUserCommandResult> {
    if (userId === followerId) {
      throw UserError.invalidParams('id');
    }

    const user = await this.#userRepository.findOneById({
      id: userId,
    });

    const existingSubscription =
      await this.#userSubscriptionRepository.findPartialOne({
        userId,
        followerId,
      });

    if (existingSubscription) {
      return {
        user,
        created: false,
      };
    }

    await this.#userSubscriptionRepository.create({
      userId,
      followerId,
    });

    return {
      user,
      created: true,
    };
  }
}
