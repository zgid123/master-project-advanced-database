import type { UserEntity } from '../entities';
import type { TSignUp } from '../schemas';

export interface IFindOneUserParams {
  email: string;
}

export type TCreateUserParams = Omit<TSignUp, 'password'> & {
  roleId?: string;
  password: string;
};

export interface IUserRepository {
  create(params: TCreateUserParams): Promise<UserEntity>;
  findOne(params: IFindOneUserParams): Promise<UserEntity>;
  findOneOrNull(params: IFindOneUserParams): Promise<UserEntity | null>;
}
