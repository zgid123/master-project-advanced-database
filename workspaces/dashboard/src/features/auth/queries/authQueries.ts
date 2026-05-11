import {
  type IErrorProps,
  type UseMutationOptions,
  useCommand,
} from '@alphacifer/react/query';
import type { TSignIn, TSignUp } from '@domain/auth';

import { signIn, signOut, signUp } from '#/features/auth/api';
import { useAuthStore } from '#/features/auth/store/authStore';

export const AUTH_MUTATION_KEYS = {
  signIn: ['mk_authSignIn'],
  signUp: ['mk_authSignUp'],
  signOut: ['mk_authSignOut'],
} as const;

type TAuthMutationOptions<TVariables> = Omit<
  UseMutationOptions<void, IErrorProps, TVariables>,
  'mutationFn'
>;

export function useSession() {
  const user = useAuthStore.use.user();
  return {
    isPending: false,
    data: user
      ? {
          user,
        }
      : null,
  };
}

export function useSignInCommand(options?: TAuthMutationOptions<TSignIn>) {
  return useCommand(signIn, {
    mutationKey: AUTH_MUTATION_KEYS.signIn,
    ...options,
  });
}

export function useSignUpCommand(options?: TAuthMutationOptions<TSignUp>) {
  return useCommand(signUp, {
    mutationKey: AUTH_MUTATION_KEYS.signUp,
    ...options,
  });
}

export function useSignOutCommand(
  options?: Omit<UseMutationOptions<void, IErrorProps, void>, 'mutationFn'>,
) {
  return useCommand(signOut, {
    mutationKey: AUTH_MUTATION_KEYS.signOut,
    ...options,
  });
}
