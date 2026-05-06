import type { TDrizzle } from '#/infrastructure/drizzle/config';

import {
  RefreshTokenCommand,
  SignInCommand,
  SignUpCommand,
  SignUserCommand,
} from '../../application/portal/v1/commands';
import { GetUserQuery } from '../../application/portal/v1/queries';
import {
  AllowedTokenRepository,
  RoleRepository,
  UserRepository,
} from '../../infrastructure/drizzle/repositories';

export interface IAuthIoC {
  portal: {
    getUserQuery: GetUserQuery;
    signInCommand: SignInCommand;
    signUpCommand: SignUpCommand;
    signUserCommand: SignUserCommand;
    refreshTokenCommand: RefreshTokenCommand;
  };
}

interface IRegisterIoCParams {
  drizzle: TDrizzle;
}

export function registerAuthIoC({ drizzle }: IRegisterIoCParams): IAuthIoC {
  const userRepository = new UserRepository(drizzle);
  const roleRepository = new RoleRepository(drizzle);
  const allowedTokenRepository = new AllowedTokenRepository(drizzle);

  const getUserQuery = new GetUserQuery(userRepository);
  const signInCommand = new SignInCommand(userRepository);
  const signUserCommand = new SignUserCommand(allowedTokenRepository);
  const signUpCommand = new SignUpCommand(userRepository, roleRepository);
  const refreshTokenCommand = new RefreshTokenCommand(allowedTokenRepository);

  return {
    portal: {
      getUserQuery,
      signInCommand,
      signUpCommand,
      signUserCommand,
      refreshTokenCommand,
    },
  };
}
