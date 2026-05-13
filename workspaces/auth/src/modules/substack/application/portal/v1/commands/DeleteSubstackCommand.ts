import type { ISubstackRepository } from '@domain/auth';
import type { ICommand } from '@domain/core';

import { SubstackError } from '../../../../domain/errors';

export interface IDeleteSubstackInput {
  slug: string;
  ownerId: string;
}

export class DeleteSubstackCommand
  implements ICommand<IDeleteSubstackInput, void>
{
  readonly #substackRepository: ISubstackRepository;

  constructor(substackRepository: ISubstackRepository) {
    this.#substackRepository = substackRepository;
  }

  public async exec({ slug, ownerId }: IDeleteSubstackInput): Promise<void> {
    const substack = await this.#substackRepository.findOne({
      slug,
    });

    if (substack.ownerId !== ownerId) {
      throw SubstackError.forbidden();
    }

    await this.#substackRepository.delete({
      id: substack.id,
    });
  }
}
