import { Worker, type Job } from 'bullmq';
import { pool, withTransaction } from '../db/pool.js';
import { NotificationService } from '../domain/inbox/notification.service.js';
import { logger } from '../observability/logger.js';
import { bullConnection, queueNames } from './queues.js';

type DigestJobData = {
  kind: 'daily_digest' | 'weekly_digest';
  user_id?: string;
  window_hours?: number;
  limit?: number;
};

type DigestTarget = {
  user_id: string;
  item_count: number;
};

async function targetsForDigest(job: DigestJobData): Promise<DigestTarget[]> {
  const windowHours = job.window_hours ?? (job.kind === 'daily_digest' ? 24 : 24 * 7);
  const limit = job.limit ?? 1000;

  const result = await pool.query<DigestTarget>({
    name: job.user_id ? 'digest-target-one-user' : 'digest-targets',
    text: `
      SELECT user_id, count(*)::int AS item_count
      FROM notifications
      WHERE read = false
        AND archived = false
        AND created_at >= now() - ($1::int * interval '1 hour')
        AND ($2::bigint IS NULL OR user_id = $2::bigint)
      GROUP BY user_id
      ORDER BY item_count DESC
      LIMIT $3
    `,
    values: [windowHours, job.user_id ?? null, limit],
  });

  return result.rows;
}

async function buildBatch(target: DigestTarget, job: DigestJobData): Promise<string> {
  const windowHours = job.window_hours ?? (job.kind === 'daily_digest' ? 24 : 24 * 7);

  return withTransaction(async (client) => {
    const batch = await client.query<{ id: string }>({
      name: 'digest-batch-insert',
      text: `
        INSERT INTO notification_batches(user_id, kind, window_start, window_end, status, item_count)
        VALUES ($1, $2, now() - ($3::int * interval '1 hour'), now(), 1, $4)
        RETURNING id
      `,
      values: [target.user_id, job.kind, windowHours, target.item_count],
    });
    const batchId = batch.rows[0]?.id;
    if (!batchId) throw new Error('Digest batch insert did not return id');

    await client.query({
      name: 'digest-batch-items-insert',
      text: `
        INSERT INTO notification_batch_items(batch_id, notification_id, notification_created_at)
        SELECT $1, id, created_at
        FROM notifications
        WHERE user_id = $2
          AND read = false
          AND archived = false
          AND created_at >= now() - ($3::int * interval '1 hour')
        ORDER BY created_at DESC, id DESC
        LIMIT 50
      `,
      values: [batchId, target.user_id, windowHours],
    });

    return batchId;
  });
}

async function runDigest(job: Job<DigestJobData>): Promise<void> {
  const data = job.data;
  const targets = await targetsForDigest(data);

  for (const target of targets) {
    const batchId = await buildBatch(target, data);
    await NotificationService.ingest({
      event_id: `digest:${data.kind}:${target.user_id}:${batchId}`,
      source_service: 'notification',
      source_type: 'digest',
      source_id: batchId,
      actor_user_id: null,
      category_code: 'digest',
      locale: 'en',
      recipients: [{ user_id: target.user_id }],
      data: {
        batch_id: batchId,
        item_count: target.item_count,
        digest_kind: data.kind,
      },
      dedup_key_prefix: `digest:${data.kind}:${target.user_id}:${batchId}`,
    });
  }

  logger.info({ jobId: job.id, targets: targets.length, kind: data.kind }, 'digest job processed');
}

const worker = new Worker(queueNames.digest, runDigest, {
  connection: bullConnection(),
  concurrency: 4,
});

worker.on('failed', (job, error) => {
  logger.error({ error, jobId: job?.id }, 'digest job failed');
});

logger.info('notification digest worker started');
