// biome-ignore-all lint/style/useNamingConvention: k6 threshold keys are snake_case.
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: Number(__ENV.VUS || 200),
  duration: __ENV.DURATION || '5m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200'],
  },
};

const baseUrl = __ENV.RECSYS_URL || 'http://localhost:3020';
const userCount = Number(__ENV.SEED_USERS || 100000);

export default function () {
  const userId = `user-${Math.floor(Math.random() * userCount) + 1}`;
  const response = http.get(`${baseUrl}/v1/feed?userId=${userId}&limit=20`);

  check(response, {
    'feed status is 200': (res) => res.status === 200,
    'feed has items array': (res) => Array.isArray(res.json('items')),
  });

  sleep(0.1);
}
