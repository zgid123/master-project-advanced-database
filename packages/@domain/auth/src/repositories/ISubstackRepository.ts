import type { SubstackEntity } from '../entities';
import type { TCreateSubstack, TUpdateSubstack } from '../schemas';

export interface IFindOneSubstackParams {
  slug: string;
  approved?: boolean;
}

export interface IFindSubstackParams {
  limit?: number;
  search?: string;
  ownerId?: string;
  approved?: boolean;
  includeDeleted?: boolean;
}

export interface ICountSubstackParams {
  search?: string;
  approved?: boolean;
}

export interface IApproveSubstackParams {
  slug: string;
}

export interface IUpdateSubstackParams {
  id: string;
  slug: string;
  data: TUpdateSubstack;
}

export interface IDeleteSubstackParams {
  id: string;
}

export interface ISubstackRepository {
  count(params: ICountSubstackParams): Promise<number>;
  delete(params: IDeleteSubstackParams): Promise<void>;
  create(params: TCreateSubstack): Promise<SubstackEntity>;
  find(params: IFindSubstackParams): Promise<SubstackEntity[]>;
  update(params: IUpdateSubstackParams): Promise<SubstackEntity>;
  approve(params: IApproveSubstackParams): Promise<SubstackEntity>;
  findOne(params: IFindOneSubstackParams): Promise<SubstackEntity>;
  findPartialOne(
    params: IFindOneSubstackParams,
  ): Promise<SubstackEntity | null>;
}
