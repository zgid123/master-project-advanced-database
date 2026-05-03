import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    fanout: {
      executor: 'shared-iterations',
      vus: Number(__ENV.VUS ?? 10),
      iterations: Number(__ENV.ITERATIONS ?? 100),
      maxDuration: __ENV.MAX_DURATION ?? '2m',
    },
  },
  thresholds: {
    http_req_duration: ['p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const baseUrl = __ENV.BASE_URL ?? 'http://127.0.0.1:3020';
const token = __ENV.INTERNAL_API_TOKEN ?? 'dev-internal-token';

function recipients() {
  const count = Number(__ENV.RECIPIENTS ?? 100);
  const offset = __ITER * count;
  return Array.from({ length: count }, (_, index) => ({ user_id: String(offset + index + 1) }));
}

export default function () {
  const payload = JSON.stringify({
    event_id: `k6:${__VU}:${__ITER}:${Date.now()}`,
    source_service: 'k6',
    source_type: 'topic',
    source_id: __ITER,
    category_code: 'new_topic',
    recipients: recipients(),
    data: {
      actor_name: 'k6',
      topic_title: 'Load test topic',
      substack_name: 'Benchmarks',
    },
    dedup_key_prefix: `k6:${__VU}:${__ITER}`,
  });

  const response = http.post(`${baseUrl}/internal/notifications/events`, payload, {
    headers: {
      'content-type': 'application/json',
      'x-internal-token': token,
    },
  });

  check(response, {
    'accepted': (r) => r.status === 202 || r.status === 200,
  });
}
