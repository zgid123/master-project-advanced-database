import type { UserEntity } from '../entities';
import type { TSignUp } from '../schemas';

export interface IFindOneUserParams {
  email: string;
}

export interface IFindOneUserByIdParams {
  id: string;
}

export interface IFindPartialOneUserParams {
  email: string;
}

export type TCreateUserParams = Omit<TSignUp, 'password'> & {
  roleId: string;
  password: string;
};

export interface IUserRepository {
  create(params: TCreateUserParams): Promise<UserEntity>;
  findOne(params: IFindOneUserParams): Promise<UserEntity>;
  findOneById(params: IFindOneUserByIdParams): Promise<UserEntity>;
  findPartialOne(params: IFindPartialOneUserParams): Promise<UserEntity | null>;
}
