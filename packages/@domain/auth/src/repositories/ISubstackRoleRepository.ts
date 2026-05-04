import type { SubstackRoleEntity } from '../entities';
import type { TCreateSubstackRole } from '../schemas';

export interface IFindOneSubstackRoleParams {
  name: string;
  substackId: string;
}

export interface ISubstackRoleRepository {
  create(params: TCreateSubstackRole): Promise<SubstackRoleEntity>;
  findOne(params: IFindOneSubstackRoleParams): Promise<SubstackRoleEntity>;
  findOneOrNull(
    params: IFindOneSubstackRoleParams,
  ): Promise<SubstackRoleEntity | null>;
}
