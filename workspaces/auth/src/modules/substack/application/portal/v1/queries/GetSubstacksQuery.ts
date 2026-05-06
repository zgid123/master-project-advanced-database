import type { ISubstackRepository, SubstackEntity } from '@domain/auth';
import type { IQuery } from '@domain/core';

export class GetSubstacksQuery implements IQuery<void, SubstackEntity[]> {
  readonly #substackRepository: ISubstackRepository;

  constructor(substackRepository: ISubstackRepository) {
    this.#substackRepository = substackRepository;
  }

  public async exec(): Promise<SubstackEntity[]> {
    return this.#substackRepository.find({
      approved: true,
    });
  }
}
