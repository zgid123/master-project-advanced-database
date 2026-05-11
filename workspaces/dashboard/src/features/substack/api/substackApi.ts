import type { IErrorProps } from '@alphacifer/react/query';
import type { TSubstackEntity } from '@domain/auth';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';

export type TListSubstacksParams = {
  limit?: number;
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

export async function listSubstacks({
  limit,
  signal,
}: TListSubstacksParams = {}): Promise<TSubstackEntity[]> {
  const search = new URLSearchParams();

  if (limit !== undefined) {
    search.set('limit', String(limit));
  }

  const query = search.toString();

  return getApi<TSubstackEntity[]>(
    createApiUrl(
      `/api/portal/substacks/${query ? `?${query}` : ''}`,
      `/v1/substacks${query ? `?${query}` : ''}`,
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
