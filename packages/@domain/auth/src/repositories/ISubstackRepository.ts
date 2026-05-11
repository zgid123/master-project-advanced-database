import type { SubstackEntity } from '../entities';
import type { TCreateSubstack } from '../schemas';

export interface IFindOneSubstackParams {
  slug: string;
  approved?: boolean;
}

export interface IFindSubstackParams {
  limit?: number;
  approved?: boolean;
}

export interface ICountSubstackParams {
  approved?: boolean;
}

export interface IApproveSubstackParams {
  slug: string;
}

export interface ISubstackRepository {
  count(params: ICountSubstackParams): Promise<number>;
  create(params: TCreateSubstack): Promise<SubstackEntity>;
  find(params: IFindSubstackParams): Promise<SubstackEntity[]>;
  approve(params: IApproveSubstackParams): Promise<SubstackEntity>;
  findOne(params: IFindOneSubstackParams): Promise<SubstackEntity>;
  findPartialOne(
    params: IFindOneSubstackParams,
  ): Promise<SubstackEntity | null>;
}
