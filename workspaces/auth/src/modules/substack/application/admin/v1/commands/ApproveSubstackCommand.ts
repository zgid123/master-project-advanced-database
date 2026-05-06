import type {
  IApproveSubstackParams,
  ISubstackRepository,
  SubstackEntity,
} from '@domain/auth';
import type { ICommand } from '@domain/core';

export class ApproveSubstackCommand
  implements ICommand<IApproveSubstackParams, SubstackEntity>
{
  readonly #substackRepository: ISubstackRepository;

  constructor(substackRepository: ISubstackRepository) {
    this.#substackRepository = substackRepository;
  }

  public async exec(params: IApproveSubstackParams): Promise<SubstackEntity> {
    return this.#substackRepository.approve(params);
  }
}
