import type {
  IFindOneRoleParams,
  IRoleRepository,
  RoleEntity,
} from '@domain/auth';

import type { TDrizzle } from '#/infrastructure/drizzle/config';

import { RoleError } from '../../../domain/errors';

export class RoleRepository implements IRoleRepository {
  readonly #drizzle: TDrizzle;

  constructor(drizzle: TDrizzle) {
    this.#drizzle = drizzle;
  }

  public async findOne({ name }: IFindOneRoleParams): Promise<RoleEntity> {
    const role = await this.#drizzle.query.roles.findFirst({
      where: (roles, { eq }) => {
        return eq(roles.name, name);
      },
    });

    if (!role) {
      throw RoleError.notFound();
    }

    return role;
  }
}
