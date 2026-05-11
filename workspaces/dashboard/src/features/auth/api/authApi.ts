import type { IErrorProps } from '@alphacifer/react/query';
import type { TSignIn, TSignUp, TUserProfile } from '@domain/auth';

import { authClient } from './authClient';

export type TAuthPayload = {
  authToken: string;
  refreshToken: string;
  user: TUserProfile;
};

type TApiResponse<TData> = {
  data?: TData;
  message?: string;
  detail?: string;
};

type TAuthClientError = {
  message?: string;
  status?: number;
};

function throwAuthError(error: TAuthClientError | null | undefined): never {
  const message = error?.message || 'Authentication request failed.';

  throw {
    name: 'BetterAuthError',
    code: error?.status ?? 400,
    detail: message,
    message,
    isNetworkError: false,
  } satisfies IErrorProps;
}

async function parseApiResponse<TData>(
  response: Response,
): Promise<TApiResponse<TData>> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return {};
  }

  return (await response.json()) as TApiResponse<TData>;
}

async function postAuth<TData>(
  path: '/api/portal/auth/sign-out',
  data?: unknown,
): Promise<TData> {
  const response = await fetch(path, {
    body: data ? JSON.stringify(data) : undefined,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
  });
  const payload = await parseApiResponse<TData>(response);

  if (!response.ok || !('data' in payload)) {
    throwAuthError({
      message: payload.detail ?? payload.message ?? response.statusText,
      status: response.status,
    });
  }

  return payload.data as TData;
}

async function postBetterAuth<TData>(
  path: '/portal/sign-in' | '/portal/sign-up',
  data: unknown,
): Promise<TData> {
  const result = await authClient.$fetch<TApiResponse<TData>>(path, {
    method: 'POST',
    body: data,
  });

  if (result.error || !result.data || !('data' in result.data)) {
    throwAuthError({
      message:
        result.data?.detail ??
        result.data?.message ??
        result.error?.message ??
        'Authentication request failed.',
      status: result.error?.status,
    });
  }

  return result.data.data as TData;
}

export async function signIn(data: TSignIn): Promise<TAuthPayload> {
  return postBetterAuth('/portal/sign-in', data);
}

export async function signUp(data: TSignUp): Promise<TAuthPayload> {
  return postBetterAuth('/portal/sign-up', data);
}

export async function getCurrentUser(): Promise<TUserProfile | null> {
  const response = await fetch('/api/portal/auth/profile');

  if (response.status === 401) {
    return null;
  }

  const payload = await parseApiResponse<TUserProfile>(response);

  if (!response.ok) {
    throwAuthError({
      message: payload.detail ?? payload.message ?? response.statusText,
      status: response.status,
    });
  }

  return payload.data ?? null;
}

export async function signOut(): Promise<null> {
  return postAuth('/api/portal/auth/sign-out');
}
