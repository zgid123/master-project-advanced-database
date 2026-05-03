import { getRedis } from '../cache/redis.js';
import { createNotificationQueue } from '../workers/queues.js';
import { logger } from '../observability/logger.js';

const stream = 'events:domain';
const group = 'notification-service';
const consumer = `${process.pid}`;
let shuttingDown = false;

type DomainEventPayload = {
  event_id?: string | undefined;
  type?: string | undefined;
  source_service?: string | undefined;
  source_type?: string | undefined;
  source_id?: string | number | undefined;
  actor_user_id?: string | number | undefined;
  category_code?: string | undefined;
  recipient_user_ids?: Array<string | number> | undefined;
  recipients?: Array<{ user_id: string | number }> | undefined;
  data?: Record<string, unknown> | undefined;
  title?: string | undefined;
  body?: string | undefined;
  dedup_key_prefix?: string | undefined;
};

type RedisStreamResponse = Array<[string, Array<[string, string[]]>]> | null;

function fieldsToObject(fields: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let index = 0; index < fields.length; index += 2) {
    const key = fields[index];
    const value = fields[index + 1];
    if (key && value !== undefined) result[key] = value;
  }
  return result;
}

function categoryForType(type: string): string {
  const map: Record<string, string> = {
    'comment.created': 'new_comment',
    'topic.created': 'new_topic',
    'vote.created': 'vote_received',
    'mention.created': 'mention',
    'job.application.updated': 'job_application_update',
    'substack.invitation.created': 'substack_invitation',
  };

  return map[type] ?? type.replaceAll('.', '_');
}

function toCreateJobData(messageId: string, payload: DomainEventPayload) {
  const type = String(payload.type ?? payload.category_code ?? 'notification.created');
  const recipients = payload.recipients
    ?? (payload.recipient_user_ids ?? []).map((userId) => ({ user_id: userId }));

  return {
    event_id: String(payload.event_id ?? messageId),
    source_service: String(payload.source_service ?? type.split('.')[0] ?? 'unknown'),
    source_type: payload.source_type ?? type,
    source_id: payload.source_id ?? null,
    actor_user_id: payload.actor_user_id ?? null,
    category_code: payload.category_code ?? categoryForType(type),
    locale: 'en',
    recipients,
    data: payload.data ?? {},
    title: payload.title,
    body: payload.body,
    dedup_key_prefix: payload.dedup_key_prefix ?? `${type}:${payload.source_id ?? messageId}`,
  };
}

async function ensureGroup(): Promise<void> {
  const redis = await getRedis();
  try {
    await redis.xgroup('CREATE', stream, group, '0', 'MKSTREAM');
  } catch (error) {
    if (!String(error).includes('BUSYGROUP')) throw error;
  }
}

async function consumeLoop(): Promise<void> {
  await ensureGroup();
  const redis = await getRedis();

  while (!shuttingDown) {
    const response = await redis.xreadgroup(
      'GROUP',
      group,
      consumer,
      'COUNT',
      100,
      'BLOCK',
      5000,
      'STREAMS',
      stream,
      '>',
    ) as RedisStreamResponse;

    const messages = response?.[0]?.[1] ?? [];
    for (const [messageId, fields] of messages) {
      try {
        const object = fieldsToObject(fields);
        const payload = JSON.parse(object.payload ?? '{}') as DomainEventPayload;
        const jobData = toCreateJobData(messageId, {
          ...payload,
          type: object.type ?? payload.type,
        });

        await createNotificationQueue.add('domain-event', jobData, {
          jobId: jobData.event_id,
          attempts: 5,
          backoff: { type: 'exponential', delay: 1_000 },
        });
        await redis.xack(stream, group, messageId);
      } catch (error) {
        logger.error({ error, messageId }, 'domain event consume failed');
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info({ stream, group, consumer }, 'starting domain event consumer');
  await consumeLoop();
}

process.on('SIGTERM', () => {
  shuttingDown = true;
});

process.on('SIGINT', () => {
  shuttingDown = true;
});
