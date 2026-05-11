// biome-ignore-all lint/style/useNamingConvention: event type aliases mirror external event names.
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const idSchema = z
  .union([z.string().min(1), z.number().int()])
  .transform(String);
const nowSeconds = () => Math.floor(Date.now() / 1_000);
const timestampSchema = z
  .union([z.string().min(1), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined) return nowSeconds();
    if (typeof value === 'number') return Math.floor(value);

    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.floor(numeric);

    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return nowSeconds();
    return Math.floor(parsed / 1_000);
  });

const voteTypeSchema = z
  .union([z.enum(['up', 'down']), z.literal(1), z.literal(-1)])
  .transform((value) => {
    if (value === 1 || value === 'up') return 'up';
    return 'down';
  });

const baseEventSchema = z.object({
  eventId: z
    .string()
    .min(1)
    .default(() => randomUUID()),
});

export const voteEventSchema = z.discriminatedUnion('type', [
  baseEventSchema.extend({
    type: z.literal('vote.created'),
    userId: idSchema,
    targetType: z.enum(['topic', 'comment']),
    targetId: idSchema,
    voteType: voteTypeSchema,
    substackId: idSchema.optional(),
    createdAt: timestampSchema,
  }),
  baseEventSchema.extend({
    type: z.literal('vote.deleted'),
    userId: idSchema,
    targetType: z.enum(['topic', 'comment']),
    targetId: idSchema,
  }),
]);

export const subscriptionEventSchema = z.discriminatedUnion('type', [
  baseEventSchema.extend({
    type: z.literal('subscription.created'),
    userId: idSchema,
    targetType: z.enum(['substack', 'topic']),
    targetId: idSchema,
    createdAt: timestampSchema,
  }),
  baseEventSchema.extend({
    type: z.literal('subscription.deleted'),
    userId: idSchema,
    targetType: z.enum(['substack', 'topic']),
    targetId: idSchema,
  }),
]);

export const topicEventSchema = z.discriminatedUnion('type', [
  baseEventSchema.extend({
    type: z.literal('topic.upsert'),
    topicId: idSchema,
    authorId: idSchema.optional(),
    substackId: idSchema.nullable().optional(),
    createdAt: timestampSchema,
    score: z.coerce.number().default(0),
  }),
  baseEventSchema.extend({
    type: z.literal('topic.deleted'),
    topicId: idSchema,
  }),
]);

export const commentEventSchema = z.discriminatedUnion('type', [
  baseEventSchema.extend({
    type: z.literal('comment.upsert'),
    commentId: idSchema,
    topicId: idSchema,
    authorId: idSchema.optional(),
    createdAt: timestampSchema,
  }),
  baseEventSchema.extend({
    type: z.literal('comment.deleted'),
    commentId: idSchema,
  }),
]);

export const substackEventSchema = z.discriminatedUnion('type', [
  baseEventSchema.extend({
    type: z.literal('substack.upsert'),
    substackId: idSchema,
    createdAt: timestampSchema,
    subscriberCount: z.coerce.number().int().nonnegative().optional(),
  }),
  baseEventSchema.extend({
    type: z.literal('substack.deleted'),
    substackId: idSchema,
  }),
]);

export const eventBodySchemas = {
  vote: voteEventSchema,
  subscription: subscriptionEventSchema,
  topic: topicEventSchema,
  comment: commentEventSchema,
  substack: substackEventSchema,
} as const;

export type VoteEvent = z.infer<typeof voteEventSchema>;
export type SubscriptionEvent = z.infer<typeof subscriptionEventSchema>;
export type TopicEvent = z.infer<typeof topicEventSchema>;
export type CommentEvent = z.infer<typeof commentEventSchema>;
export type SubstackEvent = z.infer<typeof substackEventSchema>;

export type RecSysEvent =
  | VoteEvent
  | SubscriptionEvent
  | TopicEvent
  | CommentEvent
  | SubstackEvent;

export type EventKind = keyof typeof eventBodySchemas;

export type IngestBatch = {
  votes: VoteEvent[];
  subscriptions: SubscriptionEvent[];
  topics: TopicEvent[];
  comments: CommentEvent[];
  substacks: SubstackEvent[];
};

export function emptyIngestBatch(): IngestBatch {
  return {
    votes: [],
    subscriptions: [],
    topics: [],
    comments: [],
    substacks: [],
  };
}

export function normalizeBodyToEvents<T>(
  schema: z.ZodType<T>,
  body: unknown,
): T[] {
  if (Array.isArray(body)) {
    return body.map((item) => schema.parse(normalizeEventInput(item)));
  }

  return [schema.parse(normalizeEventInput(body))];
}

export function normalizeEventInput(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;

  const raw = input as Record<string, unknown>;
  const eventType = raw.eventType ?? raw.type;
  const payload =
    raw.payload && typeof raw.payload === 'object'
      ? (raw.payload as Record<string, unknown>)
      : raw;
  const normalized: Record<string, unknown> = {
    ...payload,
    eventId: raw.eventId ?? payload.eventId ?? randomUUID(),
    type: normalizeEventType(String(eventType ?? payload.type ?? '')),
  };

  if (raw.emittedAt && !normalized.createdAt)
    normalized.createdAt = raw.emittedAt;

  if (normalized.votedAt && !normalized.createdAt)
    normalized.createdAt = normalized.votedAt;
  if (normalized.since && !normalized.createdAt)
    normalized.createdAt = normalized.since;

  if (
    !normalized.targetId &&
    normalized.topicId &&
    normalized.type?.toString().startsWith('vote.')
  ) {
    normalized.targetType = 'topic';
    normalized.targetId = normalized.topicId;
  }

  if (
    !normalized.targetId &&
    normalized.commentId &&
    normalized.type?.toString().startsWith('vote.')
  ) {
    normalized.targetType = 'comment';
    normalized.targetId = normalized.commentId;
  }

  return normalized;
}

function normalizeEventType(type: string): string {
  switch (type) {
    case 'topic.created':
    case 'topic.updated':
      return 'topic.upsert';
    case 'comment.created':
    case 'comment.updated':
      return 'comment.upsert';
    case 'substack.created':
    case 'substack.updated':
      return 'substack.upsert';
    default:
      return type;
  }
}
