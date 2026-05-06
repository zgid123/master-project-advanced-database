import {
  type ISubstackRoleAssignmentRepository,
  SubstackRoleAssignmentEntity,
  type TCreateSubstackRoleAssignment,
} from '@domain/auth';

import type { TDrizzle } from '#/infrastructure/drizzle/config';
import { substackRoleAssignments } from '#/infrastructure/drizzle/schemas/substackRoleAssignments';

import { SubstackError } from '../../../domain/errors';

export class SubstackRoleAssignmentRepository
  implements ISubstackRoleAssignmentRepository
{
  readonly #drizzle: TDrizzle;

  constructor(drizzle: TDrizzle) {
    this.#drizzle = drizzle;
  }

  public async create(
    params: TCreateSubstackRoleAssignment,
  ): Promise<SubstackRoleAssignmentEntity> {
    const [createdSubstackRoleAssignment] = await this.#drizzle
      .insert(substackRoleAssignments)
      .values(params)
      .returning()
      .execute();

    if (!createdSubstackRoleAssignment) {
      throw SubstackError.cannotCreate();
    }

    return SubstackRoleAssignmentEntity.create(createdSubstackRoleAssignment);
  }
}
