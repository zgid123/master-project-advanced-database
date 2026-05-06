import type { TSubstackRole } from '../schemas';

export type TSubstackRoleEntity = TSubstackRole;

export class SubstackRoleEntity implements TSubstackRoleEntity {
  public id: string;
  public name: string;
  public createdAt: Date;
  public updatedAt: Date;
  public substackId: string;

  constructor({
    id,
    name,
    createdAt,
    updatedAt,
    substackId,
  }: TSubstackRoleEntity) {
    this.id = id;
    this.name = name;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.substackId = substackId;
  }

  public static create(params: TSubstackRoleEntity): SubstackRoleEntity {
    return new SubstackRoleEntity(params);
  }
}
