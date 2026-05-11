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

export const ingestBatchSize = new Histogram({
  name: 'recsys_ingest_batch_size',
  help: 'Number of stream messages seen per ingest batch',
  buckets: [1, 10, 50, 100, 250, 500, 1000],
  registers: [metricsRegistry],
});

export const ingestLagSeconds = new Histogram({
  name: 'recsys_ingest_lag_seconds',
  help: 'Approximate lag between event time and graph ingestion',
  buckets: [0.5, 1, 2, 5, 15, 30, 60, 300],
  registers: [metricsRegistry],
});

export const candidatesPerFeed = new Histogram({
  name: 'recsys_candidates_per_feed',
  help: 'Candidate count contributing to a generated feed by source',
  labelNames: ['source'] as const,
  buckets: [0, 1, 10, 50, 100, 200, 500],
  registers: [metricsRegistry],
});

export const recommendationLatency = new Histogram({
  name: 'recsys_recommendation_latency_seconds',
  help: 'Feed generation latency in seconds',
  buckets: [0.025, 0.05, 0.1, 0.2, 0.5, 1, 2],
  registers: [metricsRegistry],
});
