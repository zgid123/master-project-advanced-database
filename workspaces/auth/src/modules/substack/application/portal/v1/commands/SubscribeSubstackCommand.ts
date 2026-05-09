import type {
  ISubstackRepository,
  ISubstackSubscriptionRepository,
  SubstackEntity,
  SubstackSubscriptionEntity,
} from '@domain/auth';
import type { ICommand } from '@domain/core';

interface ISubscribeSubstackCommandParams {
  slug: string;
  userId: string;
}

interface ISubscribeSubstackCommandResult {
  created: boolean;
  substack: SubstackEntity;
  subscription: SubstackSubscriptionEntity;
}

export class SubscribeSubstackCommand
  implements
    ICommand<ISubscribeSubstackCommandParams, ISubscribeSubstackCommandResult>
{
  readonly #substackRepository: ISubstackRepository;
  readonly #substackSubscriptionRepository: ISubstackSubscriptionRepository;

  constructor(
    substackRepository: ISubstackRepository,
    substackSubscriptionRepository: ISubstackSubscriptionRepository,
  ) {
    this.#substackRepository = substackRepository;
    this.#substackSubscriptionRepository = substackSubscriptionRepository;
  }

  public async exec({
    slug,
    userId,
  }: ISubscribeSubstackCommandParams): Promise<ISubscribeSubstackCommandResult> {
    const substack = await this.#substackRepository.findOne({
      slug,
      approved: true,
    });

    const existingSubscription =
      await this.#substackSubscriptionRepository.findPartialOne({
        userId,
        substackId: substack.id,
      });

    if (existingSubscription) {
      return {
        substack,
        created: false,
        subscription: existingSubscription,
      };
    }

    const subscription = await this.#substackSubscriptionRepository.create({
      userId,
      substackId: substack.id,
    });

    return {
      substack,
      subscription,
      created: true,
    };
  }
}
