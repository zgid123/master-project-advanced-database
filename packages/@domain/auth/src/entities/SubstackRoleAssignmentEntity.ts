import type { TSubstackRoleAssignment } from '../schemas';

export type TSubstackRoleAssignmentEntity = TSubstackRoleAssignment;

export class SubstackRoleAssignmentEntity
  implements TSubstackRoleAssignmentEntity
{
  public id: string;
  public userId: string;
  public createdAt: Date;
  public updatedAt: Date;
  public substackRoleId: string;

  constructor({
    id,
    userId,
    createdAt,
    updatedAt,
    substackRoleId,
  }: TSubstackRoleAssignmentEntity) {
    this.id = id;
    this.userId = userId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.substackRoleId = substackRoleId;
  }

  public static create(
    params: TSubstackRoleAssignmentEntity,
  ): SubstackRoleAssignmentEntity {
    return new SubstackRoleAssignmentEntity(params);
  }
}
