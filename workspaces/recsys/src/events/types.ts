// biome-ignore-all lint/style/useNamingConvention: event type aliases mirror external event names.
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const idSchema = z
  .union([z.string().min(1), z.number().int()])
  .transform(String);
const nowSeconds = () => Math.floor(Date.now() / 1_000);

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
    voteType: z.enum(['up', 'down']),
    createdAt: z.coerce.number().int().nonnegative().default(nowSeconds),
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
    createdAt: z.coerce.number().int().nonnegative().default(nowSeconds),
  }),
  baseEventSchema.extend({
    type: z.literal('subscription.deleted'),
    userId: idSchema,
    targetType: z.enum(['substack', 'topic']),
    targetId: idSchema,
  }),
]);

export const topicEventSchema = baseEventSchema.extend({
  type: z.literal('topic.upsert'),
  topicId: idSchema,
  substackId: idSchema.nullable().optional(),
  createdAt: z.coerce.number().int().nonnegative().default(nowSeconds),
  score: z.coerce.number().default(0),
});

export const commentEventSchema = baseEventSchema.extend({
  type: z.literal('comment.upsert'),
  commentId: idSchema,
  topicId: idSchema,
  createdAt: z.coerce.number().int().nonnegative().default(nowSeconds),
});

export const substackEventSchema = baseEventSchema.extend({
  type: z.literal('substack.upsert'),
  substackId: idSchema,
  createdAt: z.coerce.number().int().nonnegative().default(nowSeconds),
});

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
    return body.map((item) => schema.parse(item));
  }

  return [schema.parse(body)];
}
