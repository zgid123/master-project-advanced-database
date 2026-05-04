import type { SubstackEntity } from '../entities';
import type { TCreateSubstack } from '../schemas';

export interface IFindOneSubstackParams {
  slug: string;
}

export interface ISubstackRepository {
  create(params: TCreateSubstack): Promise<SubstackEntity>;
  findOne(params: IFindOneSubstackParams): Promise<SubstackEntity>;
  findOneOrNull(params: IFindOneSubstackParams): Promise<SubstackEntity | null>;
}
