import type { ISubstackRepository } from '@domain/auth';
import type { IQuery } from '@domain/core';

export class GetTotalSubstacksQuery implements IQuery<void, number> {
  readonly #substackRepository: ISubstackRepository;

  constructor(substackRepository: ISubstackRepository) {
    this.#substackRepository = substackRepository;
  }

  public async exec(): Promise<number> {
    return this.#substackRepository.count({
      approved: true,
    });
  }
}
