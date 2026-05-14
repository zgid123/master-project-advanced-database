import type { IErrorProps } from '@alphacifer/react/query';

import type { TComment, TPagination, TSearchTopicsResponse, TTopic } from '../types';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';

type TApiResponse<TData> = {
  data?: TData;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  message?: string;
  detail?: string;
};

type TApiTopic = {
  id: string;
  title: string;
  body?: string;
  slug: string;
  is_solved: boolean;
  user_id: string;
  substack_id?: string;
  created_at: string;
  updated_at: string;
  vote_score: number;
  comments_count: number;
  subscriptions_count: number;
  has_accepted_answer: boolean;
  is_subscribed: boolean;
};

type TApiComment = {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  is_accepted: boolean;
  vote_score: number;
  created_at: string;
  updated_at: string;
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

async function parseApiResponse<TData>(
  response: Response,
): Promise<TApiResponse<TData>> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return {};
  }

  return (await response.json()) as TApiResponse<TData>;
}

function mapTopic(data: TApiTopic): TTopic {
  return {
    id: data.id,
    title: data.title,
    body: data.body,
    slug: data.slug,
    isSolved: data.is_solved,
    userId: data.user_id,
    substackId: data.substack_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    voteScore: data.vote_score,
    commentsCount: data.comments_count,
    subscriptionsCount: data.subscriptions_count,
    hasAcceptedAnswer: data.has_accepted_answer,
    isSubscribed: data.is_subscribed,
  };
}

function mapComment(data: TApiComment): TComment {
  return {
    id: data.id,
    topicId: data.topic_id,
    userId: data.user_id,
    content: data.content,
    isAccepted: data.is_accepted,
    voteScore: data.vote_score,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapPagination(pagination: TApiResponse<unknown>['pagination']): TPagination {
  return {
    page: pagination?.page ?? 1,
    limit: pagination?.limit ?? 10,
    total: pagination?.total ?? 0,
    totalPages: pagination?.total_pages ?? 1,
  };
}

async function request<TData>(
  path: string,
  options?: RequestInit,
): Promise<TApiResponse<TData>> {
  const response = await fetch(path, options);
  const payload = await parseApiResponse<TData>(response);

  if (!response.ok) {
    throwQnaError(response, payload);
  }

  return payload;
}

export async function searchTopics({
  query,
  page = 1,
  limit = 10,
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

  const payload = await request<TApiTopic[]>(
    createApiUrl(
      `/api/portal/qna/topics/search?${params.toString()}`,
      `/v1/topics/search?${params.toString()}`,
    ),
    { signal },
  );

  return {
    data: (payload.data ?? []).map(mapTopic),
    pagination: mapPagination(payload.pagination),
  };
}

export async function getTopicDetail({
  id,
  signal,
}: {
  id: string;
  signal?: AbortSignal;
}): Promise<TTopic> {
  const payload = await request<TApiTopic>(
    createApiUrl(`/api/portal/qna/topics/${id}`, `/v1/topics/${id}`),
    { signal },
  );

  if (!payload.data) {
    throwQnaError(new Response(null, { status: 404 }), payload);
  }
  const data = payload.data as TApiTopic;
  return mapTopic(data);
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
  const payload = await request<TApiTopic>(
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

  if (!payload.data) {
    throwQnaError(new Response(null, { status: 400 }), payload);
  }
  const data = payload.data as TApiTopic;
  return mapTopic(data);
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
  const payload = await request<TApiTopic>(
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

  if (!payload.data) {
    throwQnaError(new Response(null, { status: 400 }), payload);
  }
  const data = payload.data as TApiTopic;
  return mapTopic(data);
}

export async function deleteTopic(id: string): Promise<void> {
  await request<unknown>(
    createApiUrl(`/api/portal/qna/topics/${id}`, `/v1/topics/${id}`),
    { method: 'DELETE' },
  );
}

export async function solveTopic(id: string): Promise<TTopic> {
  const payload = await request<TApiTopic>(
    createApiUrl(`/api/portal/qna/topics/${id}/solve`, `/v1/topics/${id}/solve`),
    { method: 'PATCH' },
  );

  if (!payload.data) {
    throwQnaError(new Response(null, { status: 400 }), payload);
  }
  const data = payload.data as TApiTopic;
  return mapTopic(data);
}

export async function voteTopic({
  id,
  point,
}: {
  id: string;
  point: 1 | -1;
}): Promise<void> {
  await request<unknown>(
    createApiUrl(`/api/portal/qna/topics/${id}/vote`, `/v1/topics/${id}/vote`),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ point }),
    },
  );
}

export async function removeTopicVote(id: string): Promise<void> {
  await request<unknown>(
    createApiUrl(`/api/portal/qna/topics/${id}/vote`, `/v1/topics/${id}/vote`),
    { method: 'DELETE' },
  );
}

export async function subscribeTopic(id: string): Promise<void> {
  await request<unknown>(
    createApiUrl(
      `/api/portal/qna/topics/${id}/subscribe`,
      `/v1/topics/${id}/subscribe`,
    ),
    { method: 'POST' },
  );
}

export async function unsubscribeTopic(id: string): Promise<void> {
  await request<unknown>(
    createApiUrl(
      `/api/portal/qna/topics/${id}/unsubscribe`,
      `/v1/topics/${id}/unsubscribe`,
    ),
    { method: 'POST' },
  );
}

export async function getTopicComments({
  topicId,
  signal,
}: {
  topicId: string;
  signal?: AbortSignal;
}): Promise<TComment[]> {
  const payload = await request<TApiComment[]>(
    createApiUrl(
      `/api/portal/qna/topics/${topicId}/comments`,
      `/v1/topics/${topicId}/comments`,
    ),
    { signal },
  );

  return (payload.data ?? []).map(mapComment);
}

export async function createComment({
  topicId,
  content,
}: {
  topicId: string;
  content: string;
}): Promise<TComment> {
  const payload = await request<TApiComment>(
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

  if (!payload.data) {
    throwQnaError(new Response(null, { status: 400 }), payload);
  }
  const data = payload.data as TApiComment;
  return mapComment(data);
}

export async function updateComment({
  id,
  content,
}: {
  id: string;
  content: string;
}): Promise<TComment> {
  const payload = await request<TApiComment>(
    createApiUrl(`/api/portal/qna/comments/${id}`, `/v1/comments/${id}`),
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  );

  if (!payload.data) {
    throwQnaError(new Response(null, { status: 400 }), payload);
  }
  const data = payload.data as TApiComment;
  return mapComment(data);
}

export async function deleteComment(id: string): Promise<void> {
  await request<unknown>(
    createApiUrl(`/api/portal/qna/comments/${id}`, `/v1/comments/${id}`),
    { method: 'DELETE' },
  );
}

export async function voteComment({
  id,
  point,
}: {
  id: string;
  point: 1 | -1;
}): Promise<void> {
  await request<unknown>(
    createApiUrl(`/api/portal/qna/comments/${id}/vote`, `/v1/comments/${id}/vote`),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ point }),
    },
  );
}

export async function acceptComment({
  commentId,
  topicId,
}: {
  commentId: string;
  topicId: string;
}): Promise<TComment> {
  const payload = await request<TApiComment>(
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

  if (!payload.data) {
    throwQnaError(new Response(null, { status: 400 }), payload);
  }
  const data = payload.data as TApiComment;
  return mapComment(data);
}
