import type { TRole } from '../schemas';

export type TRoleEntity = TRole;

export class RoleEntity implements TRoleEntity {
  public id: string;
  public name: string;
  public createdAt: Date;
  public updatedAt: Date;
  public displayName: string;

  constructor({ id, name, createdAt, updatedAt, displayName }: TRoleEntity) {
    this.id = id;
    this.name = name;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.displayName = displayName;
  }

  public static create(params: TRoleEntity): RoleEntity {
    return new RoleEntity(params);
  }
}
