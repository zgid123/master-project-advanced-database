import type { SubstackRoleEntity } from '../entities';
import type { TCreateSubstackRole } from '../schemas';

export interface ISubstackRoleRepository {
  create(params: TCreateSubstackRole): Promise<SubstackRoleEntity>;
}
