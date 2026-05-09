import {
  type IFindOneUserByIdParams,
  type IFindOneUserParams,
  type IFindPartialOneUserParams,
  type IUserRepository,
  type TCreateUserParams,
  UserEntity,
} from '@domain/auth';

import type { TDrizzle } from '#/infrastructure/drizzle/config';
import { users } from '#/infrastructure/drizzle/schemas/users';
import { bcryptHash } from '#/infrastructure/security/hash';

import { UserError } from '../../../domain/errors';

export class UserRepository implements IUserRepository {
  readonly #drizzle: TDrizzle;

  constructor(drizzle: TDrizzle) {
    this.#drizzle = drizzle;
  }

  public async create({
    email,
    roleId,
    password,
  }: TCreateUserParams): Promise<UserEntity> {
    const { hash } = await bcryptHash({
      source: password,
    });

    const [createdUser] = await this.#drizzle
      .insert(users)
      .values({
        email,
        roleId,
        password: hash,
      })
      .returning()
      .execute();

    if (!createdUser) {
      throw UserError.cannotCreate();
    }

    const role = await this.#drizzle.query.roles.findFirst({
      where: (roles, { eq }) => {
        return eq(roles.id, createdUser.roleId);
      },
    });

    if (!role) {
      throw UserError.cannotCreate();
    }

    return UserEntity.create({
      ...createdUser,
      role,
    });
  }

  public async findOne({ email }: IFindOneUserParams): Promise<UserEntity> {
    const user = await this.findPartialOne({
      email,
    });

    if (!user) {
      throw UserError.notFound();
    }

    return user;
  }

  public async findOneById({
    id,
  }: IFindOneUserByIdParams): Promise<UserEntity> {
    const user = await this.#drizzle.query.users.findFirst({
      where: (users, { eq }) => {
        return eq(users.id, id);
      },
      with: {
        role: true,
      },
    });

    if (!user) {
      throw UserError.notFound();
    }

    return UserEntity.create(user);
  }

  public async findPartialOne({
    email,
  }: IFindPartialOneUserParams): Promise<UserEntity | null> {
    const user = await this.#drizzle.query.users.findFirst({
      where: (users, { eq }) => {
        return eq(users.email, email);
      },
      with: {
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    return UserEntity.create(user);
  }
}
