import type { SubstackEntity } from '../entities';
import type { TCreateSubstack } from '../schemas';

export interface IFindOneSubstackParams {
  slug: string;
  approved?: boolean;
}

export interface IFindSubstackParams {
  approved?: boolean;
}

export interface ISubstackRepository {
  create(params: TCreateSubstack): Promise<SubstackEntity>;
  find(params: IFindSubstackParams): Promise<SubstackEntity[]>;
  findOne(params: IFindOneSubstackParams): Promise<SubstackEntity>;
  findPartialOne(
    params: IFindOneSubstackParams,
  ): Promise<SubstackEntity | null>;
}
