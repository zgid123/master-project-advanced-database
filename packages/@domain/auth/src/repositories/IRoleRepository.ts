import type { RoleEntity } from '../entities';

export interface IFindOneRoleParams {
  name: string;
}

export interface IRoleRepository {
  findOne(params: IFindOneRoleParams): Promise<RoleEntity>;
}
