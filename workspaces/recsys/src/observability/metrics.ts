import {
  Counter,
  collectDefaultMetrics,
  Histogram,
  Registry,
} from 'prom-client';

export const metricsRegistry = new Registry();

collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'recsys_',
});

export const feedRequests = new Counter({
  name: 'recsys_feed_requests_total',
  help: 'Total feed requests by cache outcome',
  labelNames: ['cache'] as const,
  registers: [metricsRegistry],
});

export const eventIngested = new Counter({
  name: 'recsys_events_ingested_total',
  help: 'Total events ingested by kind',
  labelNames: ['kind'] as const,
  registers: [metricsRegistry],
});

export const recommendationLatency = new Histogram({
  name: 'recsys_recommendation_latency_seconds',
  help: 'Feed generation latency in seconds',
  buckets: [0.025, 0.05, 0.1, 0.2, 0.5, 1, 2],
  registers: [metricsRegistry],
});
