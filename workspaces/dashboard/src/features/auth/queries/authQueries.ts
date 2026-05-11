import {
  type IErrorProps,
  type TQueryKey,
  type UseMutationOptions,
  useCommand,
  useQuery,
  useQueryClient,
} from '@alphacifer/react/query';
import type { TSignIn, TSignUp } from '@domain/auth';

import {
  getCurrentUser,
  signIn,
  signOut,
  signUp,
  type TAuthPayload,
} from '#/features/auth/api';

export const AUTH_MUTATION_KEYS = {
  signIn: ['mk_authSignIn'],
  signUp: ['mk_authSignUp'],
  signOut: ['mk_authSignOut'],
} as const;

export const AUTH_QUERY_KEYS = {
  currentUser: 'qk_authCurrentUser' satisfies TQueryKey,
} as const;

const CURRENT_USER_QUERY_KEY: [typeof AUTH_QUERY_KEYS.currentUser, []] = [
  AUTH_QUERY_KEYS.currentUser,
  [],
];

type TAuthMutationOptions<TVariables> = Omit<
  UseMutationOptions<TAuthPayload, IErrorProps, TVariables>,
  'mutationFn'
>;

export function useSignInCommand(options?: TAuthMutationOptions<TSignIn>) {
  const queryClient = useQueryClient();

  return useCommand(signIn, {
    mutationKey: AUTH_MUTATION_KEYS.signIn,
    ...options,
    onSuccess: (...params) => {
      void queryClient.invalidateQueries({
        queryKey: CURRENT_USER_QUERY_KEY,
      });
      options?.onSuccess?.(...params);
    },
  });
}

export function useSignUpCommand(options?: TAuthMutationOptions<TSignUp>) {
  const queryClient = useQueryClient();

  return useCommand(signUp, {
    mutationKey: AUTH_MUTATION_KEYS.signUp,
    ...options,
    onSuccess: (...params) => {
      void queryClient.invalidateQueries({
        queryKey: CURRENT_USER_QUERY_KEY,
      });
      options?.onSuccess?.(...params);
    },
  });
}

export function useCurrentUserQuery() {
  return useQuery(
    getCurrentUser,
    CURRENT_USER_QUERY_KEY,
    {
      retry: false,
      staleTime: 30_000,
    },
    {
      defaultValue: null,
    },
  );
}

export function useSignOutCommand() {
  const queryClient = useQueryClient();

  return useCommand(signOut, {
    mutationKey: AUTH_MUTATION_KEYS.signOut,
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      void queryClient.invalidateQueries({
        queryKey: CURRENT_USER_QUERY_KEY,
      });
    },
  });
}
