import type {
  IUserRepository,
  IUserSubscriptionRepository,
} from '@domain/auth';
import type { ICommand } from '@domain/core';

interface IUnsubscribeUserCommandParams {
  userId: string;
  followerId: string;
}

export class UnsubscribeUserCommand
  implements ICommand<IUnsubscribeUserCommandParams, void>
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
  }: IUnsubscribeUserCommandParams): Promise<void> {
    await this.#userRepository.findOneById({
      id: userId,
    });

    await this.#userSubscriptionRepository.delete({
      userId,
      followerId,
    });
  }
}
