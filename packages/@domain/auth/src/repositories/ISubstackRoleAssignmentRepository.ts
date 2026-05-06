import type { SubstackRoleAssignmentEntity } from '../entities';
import type { TCreateSubstackRoleAssignment } from '../schemas';

export interface ISubstackRoleAssignmentRepository {
  create(
    params: TCreateSubstackRoleAssignment,
  ): Promise<SubstackRoleAssignmentEntity>;
}
