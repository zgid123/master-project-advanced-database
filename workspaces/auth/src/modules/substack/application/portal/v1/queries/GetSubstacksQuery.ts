import type { ISubstackRepository, SubstackEntity } from '@domain/auth';
import type { IQuery } from '@domain/core';

export interface IGetSubstacksParams {
  limit?: number;
}

export class GetSubstacksQuery
  implements IQuery<IGetSubstacksParams | undefined, SubstackEntity[]>
{
  readonly #substackRepository: ISubstackRepository;

  constructor(substackRepository: ISubstackRepository) {
    this.#substackRepository = substackRepository;
  }

  public async exec({
    limit,
  }: IGetSubstacksParams = {}): Promise<SubstackEntity[]> {
    return this.#substackRepository.find({
      limit,
      approved: true,
    });
  }
}
