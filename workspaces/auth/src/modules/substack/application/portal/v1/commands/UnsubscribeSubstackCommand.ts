import type {
  ISubstackRepository,
  ISubstackSubscriptionRepository,
} from '@domain/auth';
import type { ICommand } from '@domain/core';

interface IUnsubscribeSubstackCommandParams {
  slug: string;
  userId: string;
}

import type { SubstackEntity } from '@domain/auth';

export class UnsubscribeSubstackCommand
  implements ICommand<IUnsubscribeSubstackCommandParams, { substack: SubstackEntity }>
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
  }: IUnsubscribeSubstackCommandParams): Promise<{ substack: SubstackEntity }> {
    const substack = await this.#substackRepository.findOne({
      slug,
      approved: true,
    });

    await this.#substackSubscriptionRepository.delete({
      userId,
      substackId: substack.id,
    });

    return { substack };
  }
}
