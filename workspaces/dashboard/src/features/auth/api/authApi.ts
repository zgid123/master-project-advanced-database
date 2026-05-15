import type { IErrorProps } from '@alphacifer/react/query';
import type { TSignIn, TSignUp, TUserEntity } from '@domain/auth';

import { useAuthStore } from '../store/authStore';

function throwAuthError(message: string, code = 400): never {
  throw {
    code,
    message,
    detail: message,
    name: 'AuthError',
    isNetworkError: false,
  } satisfies IErrorProps;
}

type TGatewayAuthResponse = {
  data?: {
    user?: TUserEntity;
    authToken?: string;
    refreshToken?: string;
  };
};

async function requestAuthAction(
  path: string,
  method: 'DELETE' | 'POST',
): Promise<void> {
  const response = await fetch(path, {
    method,
  });

  if (!response.ok && response.status !== 204) {
    throwAuthError('Auth action failed.', response.status);
  }
}

export async function signIn(data: TSignIn): Promise<void> {
  const response = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });

  const parsed = (await response.json()) as TGatewayAuthResponse;

  if (!response.ok || !parsed.data?.user) {
    throwAuthError('Sign in failed.', response.status);
  }

  useAuthStore.getState().setAuth({
    user: parsed.data.user,
    authToken: parsed.data.authToken ?? '',
    refreshToken: parsed.data.refreshToken ?? '',
  });
}

export async function signUp(data: TSignUp): Promise<void> {
  const response = await fetch('/api/auth/sign-up', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: data.email,
      email: data.email,
      password: data.password,
    }),
  });

  const parsed = (await response.json()) as TGatewayAuthResponse;

  if (!response.ok || !parsed.data?.user) {
    throwAuthError('Sign up failed.', response.status);
  }

  useAuthStore.getState().setAuth({
    user: parsed.data.user,
    authToken: parsed.data.authToken ?? '',
    refreshToken: parsed.data.refreshToken ?? '',
  });
}

export async function signOut(): Promise<void> {
  const state = useAuthStore.getState();
  const refreshToken = state.refreshToken;

  await fetch('/api/auth/sign-out', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: refreshToken ?? undefined }),
  }).catch((error) => {
    console.error('Failed to call api-gateway sign-out', error);
  });

  state.clearAuth();
}

export async function getProfile(): Promise<TUserEntity> {
  const response = await fetch('/api/portal/auth/profile');
  const parsed = (await response.json()) as { data?: TUserEntity };

  if (!response.ok || !parsed.data) {
    throwAuthError('Failed to get profile.', response.status);
  }

  return parsed.data;
}

export async function refresh(): Promise<void> {
  const state = useAuthStore.getState();
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: state.refreshToken ?? undefined }),
  });
  const parsed = (await response.json()) as TGatewayAuthResponse;

  if (!response.ok || !parsed.data?.user) {
    throwAuthError('Refresh failed.', response.status);
  }

  state.setAuth({
    user: parsed.data.user,
    authToken: parsed.data.authToken ?? '',
    refreshToken: parsed.data.refreshToken ?? '',
  });
}

export const refreshAuth = refresh;

export function subscribeUser(userId: string): Promise<void> {
  return requestAuthAction(
    `/api/portal/auth/users/${encodeURIComponent(userId)}/subscribe`,
    'POST',
  );
}

export function unsubscribeUser(userId: string): Promise<void> {
  return requestAuthAction(
    `/api/portal/auth/users/${encodeURIComponent(userId)}/subscribe`,
    'DELETE',
  );
}
