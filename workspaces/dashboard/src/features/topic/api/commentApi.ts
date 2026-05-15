/** biome-ignore-all lint/style/useNamingConvention: ignore */
import type { IErrorProps } from '@alphacifer/react/query';

import type { TComment } from '../types';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';

type TApiResponse<TData> = {
  data?: TData;
  message?: string;
  detail?: string;
};

function createApiUrl(dashboardPath: string, gatewayPath: string): string {
  if (typeof window !== 'undefined') {
    return dashboardPath;
  }

  return new URL(gatewayPath, API_GATEWAY_URL).toString();
}

function throwQnaError(response: Response, payload: TApiResponse<unknown>) {
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
    name: 'QnaApiError',
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

export async function getTopicComments({
  topicId,
  signal,
}: {
  topicId: string;
  signal?: AbortSignal;
}): Promise<TComment[]> {
  const response = await fetch(
    createApiUrl(
      `/api/portal/qna/topics/${topicId}/comments`,
      `/v1/topics/${topicId}/comments`,
    ),
    { signal },
  );

  const payload = await parseApiResponse<TComment[]>(response);

  if (!response.ok) {
    throwQnaError(response, payload);
  }

  return payload.data ?? [];
}

export async function createComment({
  topicId,
  content,
}: {
  topicId: string;
  content: string;
}): Promise<TComment> {
  const response = await fetch(
    createApiUrl('/api/portal/qna/comments', '/v1/comments'),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        topic_id: topicId,
        content,
      }),
    },
  );

  const payload = await parseApiResponse<TComment>(response);

  if (!response.ok) {
    throwQnaError(response, payload);
  }

  if (!payload.data) {
    throwQnaError(new Response(null, { status: 400 }), payload);
  }

  return payload.data as TComment;
}

export async function updateComment({
  id,
  content,
}: {
  id: string;
  content: string;
}): Promise<TComment> {
  const response = await fetch(
    createApiUrl(`/api/portal/qna/comments/${id}`, `/v1/comments/${id}`),
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  );

  const payload = await parseApiResponse<TComment>(response);

  if (!response.ok) {
    throwQnaError(response, payload);
  }

  if (!payload.data) {
    throwQnaError(new Response(null, { status: 400 }), payload);
  }

  return payload.data as TComment;
}

export async function deleteComment(id: string): Promise<void> {
  const response = await fetch(
    createApiUrl(`/api/portal/qna/comments/${id}`, `/v1/comments/${id}`),
    { method: 'DELETE' },
  );

  if (!response.ok) {
    const payload = await parseApiResponse<unknown>(response);
    throwQnaError(response, payload);
  }
}

export async function voteComment({
  id,
  point,
}: {
  id: string;
  point: 1 | -1;
}): Promise<void> {
  const response = await fetch(
    createApiUrl(
      `/api/portal/qna/comments/${id}/vote`,
      `/v1/comments/${id}/vote`,
    ),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ point }),
    },
  );

  if (!response.ok) {
    const payload = await parseApiResponse<unknown>(response);
    throwQnaError(response, payload);
  }
}

export async function acceptComment({
  commentId,
  topicId,
}: {
  commentId: string;
  topicId: string;
}): Promise<TComment> {
  const response = await fetch(
    createApiUrl(
      `/api/portal/qna/comments/${commentId}/accept`,
      `/v1/comments/${commentId}/accept`,
    ),
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId }),
    },
  );

  const payload = await parseApiResponse<TComment>(response);

  if (!response.ok) {
    throwQnaError(response, payload);
  }

  const { data } = payload;

  if (!data) {
    throwQnaError(new Response(null, { status: 400 }), payload);
  }

  return data as TComment;
}
