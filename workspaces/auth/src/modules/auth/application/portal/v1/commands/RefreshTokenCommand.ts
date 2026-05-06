import type { IAllowedTokenRepository, UserEntity } from '@domain/auth';
import type { ICommand } from '@domain/core';

interface IRefreshTokenCommandParams {
  refreshToken: string;
}

export class RefreshTokenCommand
  implements ICommand<IRefreshTokenCommandParams, UserEntity | null>
{
  #allowedTokenRepository: IAllowedTokenRepository;

  constructor(allowedTokenRepository: IAllowedTokenRepository) {
    this.#allowedTokenRepository = allowedTokenRepository;
  }

  public async exec({
    refreshToken,
  }: IRefreshTokenCommandParams): Promise<UserEntity | null> {
    const allowedToken = await this.#allowedTokenRepository.findOne({
      refreshToken,
    });

    if (!allowedToken?.user) {
      return null;
    }

    if (allowedToken.isExpired) {
      return null;
    }

    return allowedToken.user;
  }
}
