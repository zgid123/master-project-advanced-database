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
import { NotificationService } from '../../infrastructure/services';

export interface IAuthIoC {
  portal: {
    getUserQuery: GetUserQuery;
    signInCommand: SignInCommand;
    signUpCommand: SignUpCommand;
    signUserCommand: SignUserCommand;
    notificationService: NotificationService;
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

  const notificationService = new NotificationService();

  return {
    portal: {
      getUserQuery,
      signInCommand,
      signUpCommand,
      signUserCommand,
      notificationService,
      refreshTokenCommand,
    },
  };
}
