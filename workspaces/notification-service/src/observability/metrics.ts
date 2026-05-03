import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

export const registry = new Registry();

collectDefaultMetrics({
  register: registry,
});

export const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['route', 'method', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry],
});

export const notificationCreated = new Counter({
  name: 'notification_created_total',
  help: 'Notifications inserted into the inbox',
  labelNames: ['category'],
  registers: [registry],
});

export const notificationDeliveryAttempts = new Counter({
  name: 'notification_delivery_attempt_total',
  help: 'Notification delivery attempts by channel and outcome',
  labelNames: ['channel', 'status'],
  registers: [registry],
});

export const queueDepth = new Gauge({
  name: 'bullmq_queue_waiting',
  help: 'BullMQ waiting job count',
  labelNames: ['queue'],
  registers: [registry],
});

let queueMetricsTimer: NodeJS.Timeout | null = null;

export async function refreshQueueDepthMetrics(): Promise<void> {
  const queues = await import('../workers/queues.js');
  const queueEntries = [
    [queues.queueNames.create, queues.createNotificationQueue],
    [queues.queueNames.email, queues.emailQueue],
    [queues.queueNames.webPush, queues.webPushQueue],
    [queues.queueNames.mobilePush, queues.mobilePushQueue],
    [queues.queueNames.sms, queues.smsQueue],
    [queues.queueNames.digest, queues.digestQueue],
  ] as const;

  for (const [name, queue] of queueEntries) {
    const counts = await queue.getJobCounts('waiting');
    queueDepth.set({ queue: name }, counts.waiting ?? 0);
  }
}

export function startQueueDepthMetrics(intervalMs = 15_000): void {
  if (queueMetricsTimer) return;

  queueMetricsTimer = setInterval(() => {
    refreshQueueDepthMetrics().catch(() => {
      // Metrics collection must not affect request handling.
    });
  }, intervalMs);
  queueMetricsTimer.unref();

  refreshQueueDepthMetrics().catch(() => {
    // Redis may not be available during local startup.
  });
}

export function stopQueueDepthMetrics(): void {
  if (!queueMetricsTimer) return;
  clearInterval(queueMetricsTimer);
  queueMetricsTimer = null;
}
