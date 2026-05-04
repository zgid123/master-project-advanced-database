import type { SubstackRoleAssignmentEntity } from '../entities';
import type { TCreateSubstackRoleAssignment } from '../schemas';

export interface IFindOneSubstackRoleAssignmentParams {
  userId: string;
  substackRoleId: string;
}

export interface ISubstackRoleAssignmentRepository {
  create(
    params: TCreateSubstackRoleAssignment,
  ): Promise<SubstackRoleAssignmentEntity>;
  findOne(
    params: IFindOneSubstackRoleAssignmentParams,
  ): Promise<SubstackRoleAssignmentEntity>;
  findOneOrNull(
    params: IFindOneSubstackRoleAssignmentParams,
  ): Promise<SubstackRoleAssignmentEntity | null>;
}
