import { Worker, type Job } from 'bullmq';
import { NotificationService } from '../domain/inbox/notification.service.js';
import { createNotificationEventSchema, type CreateNotificationEventInput } from '../domain/inbox/notification.types.js';
import { logger } from '../observability/logger.js';
import { bullConnection, queueNames } from './queues.js';

async function createNotifications(job: Job<CreateNotificationEventInput>): Promise<void> {
  const payload = createNotificationEventSchema.parse(job.data);
  const result = await NotificationService.ingest(payload);
  logger.info({
    jobId: job.id,
    eventId: payload.event_id,
    inserted: result.inserted.length,
    duplicateEvent: result.duplicate_event,
    skippedRecipients: result.skipped_recipients,
  }, 'notification create job processed');
}

const worker = new Worker(queueNames.create, createNotifications, {
  connection: bullConnection(),
  concurrency: 20,
});

worker.on('failed', (job, error) => {
  logger.error({ error, jobId: job?.id }, 'notification create job failed');
});

logger.info('notification create worker started');
