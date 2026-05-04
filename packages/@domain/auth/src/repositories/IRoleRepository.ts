import type { RoleEntity } from '../entities';
import type { TCreateRole } from '../schemas';

export interface IFindOneRoleParams {
  name: string;
}

export interface IRoleRepository {
  create(params: TCreateRole): Promise<RoleEntity>;
  findOne(params: IFindOneRoleParams): Promise<RoleEntity>;
  findOneOrNull(params: IFindOneRoleParams): Promise<RoleEntity | null>;
}
