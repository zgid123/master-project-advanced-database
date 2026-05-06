import type { ISubstackRepository, SubstackEntity } from '@domain/auth';
import type { IQuery } from '@domain/core';

interface IGetSubstackQueryParams {
  slug: string;
}

export class GetSubstackQuery
  implements IQuery<IGetSubstackQueryParams, SubstackEntity>
{
  readonly #substackRepository: ISubstackRepository;

  constructor(substackRepository: ISubstackRepository) {
    this.#substackRepository = substackRepository;
  }

  public async exec({
    slug,
  }: IGetSubstackQueryParams): Promise<SubstackEntity> {
    return this.#substackRepository.findOne({
      slug,
      approved: true,
    });
  }
}
