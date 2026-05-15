import {
  type IErrorProps,
  type UseMutationOptions,
  useCommand,
} from '@alphacifer/react/query';
import type { TSignIn, TSignUp } from '@domain/auth';
import { useEffect, useState } from 'react';

import {
  getProfile,
  refresh,
  signIn,
  signOut,
  signUp,
} from '#/features/auth/api';
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

let autoSignInPromise: Promise<void> | null = null;
let triedAutoSignIn = false;

export function useSession() {
  const user = useAuthStore.use.user();
  const setAuth = useAuthStore.use.setAuth();
  const [isChecking, setIsChecking] = useState(!user && !triedAutoSignIn);

  useEffect(() => {
    if (user || triedAutoSignIn) {
      if (!user && autoSignInPromise) {
        autoSignInPromise.finally(() => {
          setIsChecking(false);
        });
      } else {
        setIsChecking(false);
      }
      return;
    }

    if (!autoSignInPromise) {
      autoSignInPromise = (async () => {
        triedAutoSignIn = true;
        try {
          const profile = await getProfile();
          setAuth({
            user: profile,
            authToken: '',
            refreshToken: '',
          });
        } catch (error) {
          // biome-ignore lint/suspicious/noExplicitAny: ignore
          if ((error as any).code === 401) {
            try {
              await refresh();
            } catch {
              // Refresh also failed, user needs to login
            }
          }
        }
      })();
    }

    autoSignInPromise.finally(() => {
      setIsChecking(false);
    });
  }, [user, setAuth]);

  return {
    isPending: isChecking && !user,
    data: user ? { user } : null,
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
