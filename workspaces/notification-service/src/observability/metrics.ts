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
