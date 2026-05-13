import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Loader2,
  Radio,
  Search,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '#/components/ui/button';

type TApiError = Error & {
  status?: number;
};

type TTopic = {
  id: string;
  title: string;
  body?: string;
  is_solved?: boolean;
  vote_score?: number;
  comments_count?: number;
  subscriptions_count?: number;
  created_at?: string;
  substack_id?: string;
};

type TTopicSearchResponse = {
  data?: TTopic[];
  pagination?: {
    total?: number;
  };
};

type TJob = {
  id: string;
  title: string;
  location?: string | null;
  jobType?: string | null;
  status?: string;
  applicationCount?: number;
  createdAt?: string;
};

type TJobListResponse = {
  items?: TJob[];
  nextCursor?: string | null;
};

type TSignal = {
  topicId?: string;
  substackId?: string | null;
  source?: string;
  sources?: string[];
  score?: number;
};

type TSignalsResponse = {
  items?: TSignal[];
  generatedAt?: string;
  cacheHit?: boolean;
};

type TNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  sent: boolean;
  createdAt?: string;
  metadata?: unknown;
};

type TNotificationsResponse = {
  data?: TNotification[];
};

export function TopicsPage() {
  const [query, setQuery] = useState('solvit');
  const [submittedQuery, setSubmittedQuery] = useState('solvit');
  const [state, setState] = useAsyncState<TTopicSearchResponse>();

  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams({
      limit: '12',
      page: '1',
      query: submittedQuery,
    });

    loadJson<TTopicSearchResponse>(
      `/api/portal/topics/search?${search.toString()}`,
      setState,
      controller.signal,
    );

    return () => controller.abort();
  }, [submittedQuery, setState]);

  const topics = state.data?.data ?? [];

  return (
    <section className='space-y-5'>
      <ServiceHeader
        description='Search Q&A topics through Dashboard -> API Gateway -> Q&A.'
        icon={<Search className='size-5' />}
        kicker='Q&A'
        title='Topics'
      />
      <section className='island-shell rounded-2xl p-5 sm:p-6'>
        <form
          className='grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]'
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(query.trim() || 'solvit');
          }}
        >
          <label className='flex h-11 min-w-0 items-center gap-3 rounded-xl border border-line bg-chip-bg px-3 text-sea-ink-soft'>
            <Search className='size-4 shrink-0' />
            <input
              className='min-w-0 flex-1 bg-transparent text-sm text-sea-ink outline-none placeholder:text-sea-ink-soft/70'
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search topics'
              type='search'
              value={query}
            />
          </label>
          <Button
            className='h-11 border border-lagoon/30 bg-lagoon/16 font-bold text-lagoon-deep hover:bg-lagoon/24'
            type='submit'
            variant='secondary'
          >
            Search
          </Button>
        </form>
      </section>
      <StatusBlock
        empty={!state.loading && !state.error && topics.length === 0}
        error={state.error}
        loading={state.loading}
      />
      <div className='space-y-3'>
        {topics.map((topic) => (
          <article
            className='island-shell rounded-2xl p-5'
            key={topic.id || topic.title}
          >
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div className='min-w-0'>
                <p className='island-kicker mb-2'>
                  {topic.substack_id ? `Substack ${topic.substack_id}` : 'Topic'}
                </p>
                <h2 className='m-0 text-xl font-extrabold text-sea-ink'>
                  {topic.title}
                </h2>
                {topic.body ? (
                  <p className='mt-2 mb-0 line-clamp-2 text-sm leading-6 text-sea-ink-soft'>
                    {topic.body}
                  </p>
                ) : null}
              </div>
              <Badge tone={topic.is_solved ? 'green' : 'blue'}>
                {topic.is_solved ? 'Solved' : 'Open'}
              </Badge>
            </div>
            <MetricRow
              items={[
                `${topic.vote_score ?? 0} votes`,
                `${topic.comments_count ?? 0} comments`,
                `${topic.subscriptions_count ?? 0} follows`,
                formatDate(topic.created_at),
              ]}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export function JobsPage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [state, setState] = useAsyncState<TJobListResponse>();

  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams({ limit: '20' });

    if (submittedQuery) {
      search.set('q', submittedQuery);
    }

    loadJson<TJobListResponse>(
      `/api/services/jobs?${search.toString()}`,
      setState,
      controller.signal,
    );

    return () => controller.abort();
  }, [submittedQuery, setState]);

  const jobs = state.data?.items ?? [];

  return (
    <section className='space-y-5'>
      <ServiceHeader
        description='Browse jobs through the Dashboard proxy to Job Service.'
        icon={<BriefcaseBusiness className='size-5' />}
        kicker='Work'
        title='Jobs'
      />
      <section className='island-shell rounded-2xl p-5 sm:p-6'>
        <form
          className='grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]'
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(query.trim());
          }}
        >
          <label className='flex h-11 min-w-0 items-center gap-3 rounded-xl border border-line bg-chip-bg px-3 text-sea-ink-soft'>
            <Search className='size-4 shrink-0' />
            <input
              className='min-w-0 flex-1 bg-transparent text-sm text-sea-ink outline-none placeholder:text-sea-ink-soft/70'
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search jobs'
              type='search'
              value={query}
            />
          </label>
          <Button
            className='h-11 border border-lagoon/30 bg-lagoon/16 font-bold text-lagoon-deep hover:bg-lagoon/24'
            type='submit'
            variant='secondary'
          >
            Search
          </Button>
        </form>
      </section>
      <StatusBlock
        empty={!state.loading && !state.error && jobs.length === 0}
        error={state.error}
        loading={state.loading}
      />
      <div className='grid gap-3 md:grid-cols-2'>
        {jobs.map((job) => (
          <article className='island-shell rounded-2xl p-5' key={job.id}>
            <div className='mb-4 flex items-start justify-between gap-3'>
              <div>
                <p className='island-kicker mb-2'>
                  {job.location || 'Remote'} · {formatJobType(job.jobType)}
                </p>
                <h2 className='m-0 text-xl font-extrabold text-sea-ink'>
                  {job.title}
                </h2>
              </div>
              <Badge tone={job.status === 'open' ? 'green' : 'blue'}>
                {job.status ?? 'open'}
              </Badge>
            </div>
            <MetricRow
              items={[
                `${job.applicationCount ?? 0} applications`,
                formatDate(job.createdAt),
              ]}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export function RecommendationsPage() {
  const [mode, setMode] = useState<'trending' | 'feed'>('trending');
  const [state, setState] = useAsyncState<TSignalsResponse>();

  useEffect(() => {
    const controller = new AbortController();
    const path =
      mode === 'feed'
        ? '/api/services/recommendations/feed?limit=20'
        : '/api/services/recommendations/trending?limit=20';

    loadJson<TSignalsResponse>(path, setState, controller.signal);

    return () => controller.abort();
  }, [mode, setState]);

  const signals = state.data?.items ?? [];

  return (
    <section className='space-y-5'>
      <ServiceHeader
        description='Recommendation signals from RecSys through Dashboard service routes.'
        icon={<Radio className='size-5' />}
        kicker='Signals'
        title='Recommendations'
      />
      <section className='island-shell rounded-2xl p-5 sm:p-6'>
        <div className='grid gap-2 sm:inline-grid sm:grid-cols-2'>
          {(['trending', 'feed'] as const).map((item) => (
            <Button
              className={
                mode === item
                  ? 'border border-lagoon/35 bg-lagoon/16 text-lagoon-deep'
                  : 'border border-line bg-white/5 text-sea-ink-soft hover:bg-link-bg-hover'
              }
              key={item}
              onClick={() => setMode(item)}
              type='button'
              variant='ghost'
            >
              {item === 'trending' ? 'Trending' : 'Personal Feed'}
            </Button>
          ))}
        </div>
      </section>
      <StatusBlock
        empty={!state.loading && !state.error && signals.length === 0}
        error={state.error}
        loading={state.loading}
      />
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
        {signals.map((signal) => (
          <article
            className='island-shell rounded-2xl p-5'
            key={`${signal.topicId}-${signal.source}`}
          >
            <div className='mb-4 flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='island-kicker mb-2'>
                  {signal.source ?? 'recommendation'}
                </p>
                <h2 className='m-0 break-all text-lg font-extrabold text-sea-ink'>
                  {signal.topicId ?? 'Unknown topic'}
                </h2>
              </div>
              <Badge tone='blue'>
                {typeof signal.score === 'number'
                  ? signal.score.toFixed(2)
                  : '0.00'}
              </Badge>
            </div>
            <MetricRow
              items={[
                signal.substackId ? `Substack ${signal.substackId}` : 'Global',
                signal.sources?.join(', ') || 'single source',
              ]}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export function NotificationsPage() {
  const [state, setState] = useAsyncState<TNotificationsResponse>();

  const reload = useMemo(() => {
    return () => {
      const controller = new AbortController();
      loadJson<TNotificationsResponse>(
        '/api/portal/notifications?limit=30',
        setState,
        controller.signal,
      );
      return controller;
    };
  }, [setState]);

  useEffect(() => {
    const controller = reload();
    return () => controller.abort();
  }, [reload]);

  const notifications = state.data?.data ?? [];

  return (
    <section className='space-y-5'>
      <ServiceHeader
        description='Authenticated notifications through Dashboard -> API Gateway -> Notifications.'
        icon={<Bell className='size-5' />}
        kicker='Inbox'
        title='Notifications'
      />
      <StatusBlock
        empty={!state.loading && !state.error && notifications.length === 0}
        error={state.error}
        loading={state.loading}
      />
      <div className='space-y-3'>
        {notifications.map((notification) => (
          <article
            className='island-shell rounded-2xl p-5'
            key={notification.id}
          >
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div className='min-w-0'>
                <div className='mb-2 flex items-center gap-2'>
                  <Badge tone={notification.read ? 'blue' : 'green'}>
                    {notification.read ? 'Read' : 'Unread'}
                  </Badge>
                  <span className='text-xs font-semibold text-sea-ink-soft'>
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <h2 className='m-0 text-xl font-extrabold text-sea-ink'>
                  {notification.title}
                </h2>
                <p className='mt-2 mb-0 text-sm leading-6 text-sea-ink-soft'>
                  {notification.body}
                </p>
              </div>
              {!notification.read ? (
                <Button
                  className='h-10 border border-lagoon/30 bg-lagoon/16 font-bold text-lagoon-deep hover:bg-lagoon/24'
                  onClick={async () => {
                    await requestJson<unknown>(
                      `/api/portal/notifications/${encodeURIComponent(
                        notification.id,
                      )}/read`,
                      { method: 'PATCH' },
                    );
                    reload();
                  }}
                  type='button'
                  variant='secondary'
                >
                  <CheckCircle2 className='size-4' />
                  Mark read
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ServiceHeader({
  description,
  icon,
  kicker,
  title,
}: {
  description: string;
  icon: React.ReactNode;
  kicker: string;
  title: string;
}) {
  return (
    <section className='island-shell rounded-2xl p-5 sm:p-6'>
      <div className='flex items-start gap-4'>
        <div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-lagoon/24 bg-lagoon/12 text-lagoon-deep'>
          {icon}
        </div>
        <div>
          <p className='island-kicker mb-2'>{kicker}</p>
          <h1 className='display-title m-0 text-3xl font-bold text-sea-ink sm:text-4xl'>
            {title}
          </h1>
          <p className='mt-2 mb-0 max-w-3xl text-sm leading-6 text-sea-ink-soft'>
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

function StatusBlock({
  empty,
  error,
  loading,
}: {
  empty: boolean;
  error: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className='island-shell flex items-center gap-3 rounded-2xl p-5 text-sm font-bold text-sea-ink-soft'>
        <Loader2 className='size-4 animate-spin text-lagoon-deep' />
        Loading
      </div>
    );
  }

  if (error) {
    return (
      <div className='island-shell rounded-2xl border border-destructive/30 p-5 text-sm font-semibold text-sea-ink-soft'>
        {error}
      </div>
    );
  }

  if (empty) {
    return (
      <div className='island-shell flex items-center gap-3 rounded-2xl p-5 text-sm font-semibold text-sea-ink-soft'>
        <Sparkles className='size-4 text-lagoon-deep' />
        No records returned.
      </div>
    );
  }

  return null;
}

function MetricRow({ items }: { items: string[] }) {
  return (
    <div className='mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-sea-ink-soft'>
      {items.filter(Boolean).map((item) => (
        <span className='inline-flex items-center gap-1.5' key={item}>
          <Clock3 className='size-3.5 text-lagoon-deep' />
          {item}
        </span>
      ))}
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'blue' | 'green';
}) {
  const className =
    tone === 'green'
      ? 'border-lagoon/24 bg-lagoon/12 text-lagoon-deep'
      : 'border-line bg-chip-bg text-sea-ink-soft';

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${className}`}
    >
      {children}
    </span>
  );
}

function useAsyncState<T>() {
  return useState<{
    data: T | null;
    error: string;
    loading: boolean;
  }>({
    data: null,
    error: '',
    loading: true,
  });
}

async function loadJson<T>(
  path: string,
  setState: ReturnType<typeof useAsyncState<T>>[1],
  signal?: AbortSignal,
) {
  setState((current) => ({ ...current, error: '', loading: true }));

  try {
    const data = await requestJson<T>(path, { signal });
    setState({ data, error: '', loading: false });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }

    setState({
      data: null,
      error: getErrorMessage(error),
      loading: false,
    });
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, init);
  const text = await response.text();
  const payload = text ? parseJson(text) : {};

  if (!response.ok) {
    const error = new Error(getPayloadMessage(payload, response)) as TApiError;
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getPayloadMessage(payload: unknown, response: Response): string {
  if (isRecord(payload)) {
    const message = payload.message ?? payload.error ?? payload.detail;

    if (typeof message === 'string') {
      return message;
    }
  }

  return response.statusText || 'Request failed';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const status = (error as TApiError).status;
    return status ? `${status}: ${error.message}` : error.message;
  }

  return 'Request failed';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function formatDate(value?: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date);
}

function formatJobType(value?: string | null): string {
  if (!value) {
    return 'Flexible';
  }

  return value.replaceAll('_', ' ');
}
