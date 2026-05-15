import type { ISubstackRepository, SubstackEntity } from '@domain/auth';
import type { IQuery } from '@domain/core';

export interface IGetSubstacksByOwnerParams {
  limit?: number;
  ownerId: string;
  search?: string;
}

export class GetSubstacksByOwnerQuery
  implements IQuery<IGetSubstacksByOwnerParams, SubstackEntity[]>
{
  readonly #substackRepository: ISubstackRepository;

  constructor(substackRepository: ISubstackRepository) {
    this.#substackRepository = substackRepository;
  }

  public async exec({
    limit,
    ownerId,
    search,
  }: IGetSubstacksByOwnerParams): Promise<SubstackEntity[]> {
    return this.#substackRepository.find({
      limit,
      ownerId,
      search,
      includeDeleted: false,
    });
  }
}
