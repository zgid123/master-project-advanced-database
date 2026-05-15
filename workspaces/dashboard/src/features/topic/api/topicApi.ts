import type { IErrorProps } from '@alphacifer/react/query';

import type { TSearchTopicsResponse, TTopic } from '../types';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';

type TApiResponse<TData> = {
  data?: TData;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  detail?: string;
};

function createApiUrl(dashboardPath: string, gatewayPath: string): string {
  if (typeof window !== 'undefined') {
    return dashboardPath;
  }

  return new URL(gatewayPath, API_GATEWAY_URL).toString();
}

function throwTopicError(response: Response, payload: TApiResponse<unknown>) {
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
    name: 'TopicApiError',
  } satisfies IErrorProps;
}

function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const newKey = key.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase(),
        );
        newObj[newKey] = toCamelCase(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

async function parseApiResponse<TData>(
  response: Response,
): Promise<TApiResponse<TData>> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return {};
  }

  const payload = await response.json();
  return toCamelCase(payload);
}

export async function searchTopics({
  query,
  page = 1,
  limit = 20,
  substackId,
  signal,
}: {
  query?: string;
  page?: number;
  limit?: number;
  substackId?: string;
  signal?: AbortSignal;
}): Promise<TSearchTopicsResponse> {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (substackId) params.set('substack_id', substackId);
  params.set('page', String(page));
  params.set('limit', String(limit));

  const response = await fetch(
    createApiUrl(
      `/api/portal/qna/topics/search?${params.toString()}`,
      `/v1/topics/search?${params.toString()}`,
    ),
    { signal },
  );

  const payload = await parseApiResponse<TTopic[]>(response);

  if (!response.ok) {
    throwTopicError(response, payload);
  }

  return {
    data: payload.data ?? [],
    pagination: {
      page: payload.pagination?.page ?? 1,
      limit: payload.pagination?.limit ?? limit,
      total: payload.pagination?.total ?? 0,
      totalPages: payload.pagination?.totalPages ?? 1,
    },
  };
}

export async function getTopicDetail({
  id,
  signal,
}: {
  id: string;
  signal?: AbortSignal;
}): Promise<TTopic> {
  const response = await fetch(
    createApiUrl(`/api/portal/qna/topics/${id}`, `/v1/topics/${id}`),
    { signal },
  );

  const payload = await parseApiResponse<TTopic>(response);

  if (!response.ok) {
    throwTopicError(response, payload);
  }

  if (!payload.data) {
    throwTopicError(new Response(null, { status: 404 }), payload);
  }

  return payload.data as TTopic;
}

export async function createTopic({
  title,
  body,
  substackId,
}: {
  title: string;
  body?: string;
  substackId?: string;
}): Promise<TTopic> {
  const response = await fetch(
    createApiUrl('/api/portal/qna/topics', '/v1/topics'),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        substack_id: substackId || undefined,
      }),
    },
  );

  const payload = await parseApiResponse<TTopic>(response);

  if (!response.ok) {
    throwTopicError(response, payload);
  }

  if (!payload.data) {
    throwTopicError(new Response(null, { status: 400 }), payload);
  }

  return payload.data as TTopic;
}

export async function updateTopic({
  id,
  title,
  body,
}: {
  id: string;
  title?: string;
  body?: string;
}): Promise<TTopic> {
  const response = await fetch(
    createApiUrl(`/api/portal/qna/topics/${id}`, `/v1/topics/${id}`),
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
      }),
    },
  );

  const payload = await parseApiResponse<TTopic>(response);

  if (!response.ok) {
    throwTopicError(response, payload);
  }

  if (!payload.data) {
    throwTopicError(new Response(null, { status: 400 }), payload);
  }

  return payload.data as TTopic;
}

export async function deleteTopic(id: string): Promise<void> {
  const response = await fetch(
    createApiUrl(`/api/portal/qna/topics/${id}`, `/v1/topics/${id}`),
    { method: 'DELETE' },
  );

  if (!response.ok) {
    const payload = await parseApiResponse<unknown>(response);
    throwTopicError(response, payload);
  }
}

export async function solveTopic(id: string): Promise<TTopic> {
  const response = await fetch(
    createApiUrl(
      `/api/portal/qna/topics/${id}/solve`,
      `/v1/topics/${id}/solve`,
    ),
    { method: 'PATCH' },
  );

  const payload = await parseApiResponse<TTopic>(response);

  if (!response.ok) {
    throwTopicError(response, payload);
  }

  if (!payload.data) {
    throwTopicError(new Response(null, { status: 400 }), payload);
  }

  return payload.data as TTopic;
}

export async function voteTopic({
  id,
  point,
}: {
  id: string;
  point: 1 | -1;
}): Promise<void> {
  const response = await fetch(
    createApiUrl(`/api/portal/qna/topics/${id}/vote`, `/v1/topics/${id}/vote`),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ point }),
    },
  );

  if (!response.ok) {
    const payload = await parseApiResponse<unknown>(response);
    throwTopicError(response, payload);
  }
}

export async function removeTopicVote(id: string): Promise<void> {
  const response = await fetch(
    createApiUrl(`/api/portal/qna/topics/${id}/vote`, `/v1/topics/${id}/vote`),
    { method: 'DELETE' },
  );

  if (!response.ok) {
    const payload = await parseApiResponse<unknown>(response);
    throwTopicError(response, payload);
  }
}

export async function subscribeTopic(id: string): Promise<void> {
  const response = await fetch(
    createApiUrl(
      `/api/portal/qna/topics/${id}/subscribe`,
      `/v1/topics/${id}/subscribe`,
    ),
    { method: 'POST' },
  );

  if (!response.ok) {
    const payload = await parseApiResponse<unknown>(response);
    throwTopicError(response, payload);
  }
}

export async function unsubscribeTopic(id: string): Promise<void> {
  const response = await fetch(
    createApiUrl(
      `/api/portal/qna/topics/${id}/unsubscribe`,
      `/v1/topics/${id}/unsubscribe`,
    ),
    { method: 'POST' },
  );

  if (!response.ok) {
    const payload = await parseApiResponse<unknown>(response);
    throwTopicError(response, payload);
  }
}
