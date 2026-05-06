import {
  type ISubstackRoleRepository,
  SubstackRoleEntity,
  type TCreateSubstackRole,
} from '@domain/auth';

import type { TDrizzle } from '#/infrastructure/drizzle/config';
import { substackRoles } from '#/infrastructure/drizzle/schemas/substackRoles';

import { SubstackError } from '../../../domain/errors';

export class SubstackRoleRepository implements ISubstackRoleRepository {
  readonly #drizzle: TDrizzle;

  constructor(drizzle: TDrizzle) {
    this.#drizzle = drizzle;
  }

  public async create(
    params: TCreateSubstackRole,
  ): Promise<SubstackRoleEntity> {
    const [createdSubstackRole] = await this.#drizzle
      .insert(substackRoles)
      .values(params)
      .returning()
      .execute();

    if (!createdSubstackRole) {
      throw SubstackError.cannotCreate();
    }

    return SubstackRoleEntity.create(createdSubstackRole);
  }
}
