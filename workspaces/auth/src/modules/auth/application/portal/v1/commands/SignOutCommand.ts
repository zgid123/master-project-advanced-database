import type { IAllowedTokenRepository } from '@domain/auth';
import type { ICommand } from '@domain/core';

interface ISignOutCommandParams {
  refreshToken: string;
}

export class SignOutCommand implements ICommand<ISignOutCommandParams, void> {
  #allowedTokenRepository: IAllowedTokenRepository;

  constructor(allowedTokenRepository: IAllowedTokenRepository) {
    this.#allowedTokenRepository = allowedTokenRepository;
  }

  public async exec({ refreshToken }: ISignOutCommandParams): Promise<void> {
    await this.#allowedTokenRepository.delete({
      refreshToken,
    });
  }
}
