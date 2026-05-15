import type { IErrorProps } from '@alphacifer/react/query';
import type { TNewSubstack, TSubstackEntity } from '@domain/auth';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';

export type TListSubstacksParams = {
  limit?: number;
  search?: string;
  signal?: AbortSignal;
};

export type TTotalSubstacks = {
  totalSubstacks: number;
};

type TApiResponse<TData> = {
  data?: TData;
  detail?: string;
  message?: string;
};

function createApiUrl(dashboardPath: string, gatewayPath: string): string {
  if (typeof window !== 'undefined') {
    return dashboardPath;
  }

  return new URL(gatewayPath, API_GATEWAY_URL).toString();
}

function throwSubstackError(
  response: Response,
  payload: TApiResponse<unknown>,
) {
  const message =
    payload.detail ??
    payload.message ??
    response.statusText ??
    'Request failed';

  throw {
    message,
    detail: message,
    code: response.status,
    isNetworkError: false,
    name: 'SubstackApiError',
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

async function getApi<TData>(
  path: string,
  signal?: AbortSignal,
): Promise<TData> {
  const response = await fetch(path, {
    signal,
  });
  const payload = await parseApiResponse<TData>(response);

  if (!response.ok || !('data' in payload)) {
    throwSubstackError(response, payload);
  }

  return payload.data as TData;
}

async function requestApi<TData>(
  path: string,
  {
    body,
    method,
    signal,
  }: {
    body?: unknown;
    method: 'DELETE' | 'POST' | 'PUT';
    signal?: AbortSignal;
  },
): Promise<TData> {
  const headers = new Headers();
  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    headers.set('content-type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(path, {
    body: requestBody,
    headers,
    method,
    signal,
  });

  if (response.status === 204) {
    return undefined as TData;
  }

  const payload = await parseApiResponse<TData>(response);

  if (!response.ok || !('data' in payload)) {
    throwSubstackError(response, payload);
  }

  return payload.data as TData;
}

export async function listSubstacks({
  limit,
  search,
  signal,
}: TListSubstacksParams = {}): Promise<TSubstackEntity[]> {
  const queryParams = new URLSearchParams();

  if (limit !== undefined) {
    queryParams.set('limit', String(limit));
  }

  if (search !== undefined) {
    queryParams.set('search', search);
  }

  const query = queryParams.toString();

  return getApi<TSubstackEntity[]>(
    createApiUrl(
      `/api/portal/substacks/${query ? `?${query}` : ''}`,
      `/v1/substacks${query ? `?${query}` : ''}`,
    ),
    signal,
  );
}

export async function getOwnedSubstacks({
  search,
  signal,
  }: {
  search?: string;
  signal?: AbortSignal;
} = {}): Promise<TSubstackEntity[]> {
  const queryParams = new URLSearchParams();

  if (search !== undefined) {
    queryParams.set('search', search);
  }

  const query = queryParams.toString();

  return getApi<TSubstackEntity[]>(
    createApiUrl(
      `/api/portal/substacks/owned${query ? `?${query}` : ''}`,
      `/v1/substacks/owned${query ? `?${query}` : ''}`,
    ),
    signal,
  );
}

export async function getTotalSubstacks({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<TTotalSubstacks> {
  return getApi<TTotalSubstacks>(
    createApiUrl('/api/portal/substacks/total', '/v1/substacks/total'),
    signal,
  );
}

interface IGetSubstackBySlugParams {
  slug: string;
  signal?: AbortSignal;
}

export async function getSubstackBySlug({
  slug,
  signal,
}: IGetSubstackBySlugParams): Promise<TSubstackEntity> {
  const encoded = encodeURIComponent(slug);

  return getApi<TSubstackEntity>(
    createApiUrl(
      `/api/portal/substacks/${encoded}`,
      `/v1/substacks/${encoded}`,
    ),
    signal,
  );
}

export function createSubstack(
  data: TNewSubstack,
  signal?: AbortSignal,
): Promise<TSubstackEntity> {
  return requestApi<TSubstackEntity>('/api/portal/substacks/', {
    body: data,
    method: 'POST',
    signal,
  });
}

export function updateSubstack(
  slug: string,
  data: TNewSubstack,
  signal?: AbortSignal,
): Promise<TSubstackEntity> {
  return requestApi<TSubstackEntity>(
    `/api/portal/substacks/${encodeURIComponent(slug)}`,
    {
      body: data,
      method: 'PUT',
      signal,
    },
  );
}

export async function deleteSubstack(
  slug: string,
  signal?: AbortSignal,
): Promise<void> {
  await requestApi<void>(`/api/portal/substacks/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    signal,
  });
}

export async function subscribeSubstack(
  slug: string,
  signal?: AbortSignal,
): Promise<void> {
  await requestApi<void>(
    `/api/portal/substacks/${encodeURIComponent(slug)}/subscribe`,
    {
      method: 'POST',
      signal,
    },
  );
}

export async function unsubscribeSubstack(
  slug: string,
  signal?: AbortSignal,
): Promise<void> {
  await requestApi<void>(
    `/api/portal/substacks/${encodeURIComponent(slug)}/subscribe`,
    {
      method: 'DELETE',
      signal,
    },
  );
}
