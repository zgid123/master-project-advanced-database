import type { AllowedTokenEntity } from '../entities';
import type { TCreateAllowedToken } from '../schemas';

export interface IFindOneAllowedTokenParams {
  refreshToken: string;
}

export interface IDeleteAllowedTokenParams {
  refreshToken: string;
}

export interface IAllowedTokenRepository {
  delete(params: IDeleteAllowedTokenParams): Promise<void>;
  create(params: TCreateAllowedToken): Promise<AllowedTokenEntity>;
  findOne(
    params: IFindOneAllowedTokenParams,
  ): Promise<AllowedTokenEntity | null>;
}
