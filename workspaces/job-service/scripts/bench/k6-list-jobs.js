import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS ?? 20),
  duration: __ENV.DURATION ?? '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<100', 'p(99)<250'],
  },
};

const baseUrl = __ENV.BASE_URL ?? 'http://localhost:3010';

export default function () {
  const res = http.get(`${baseUrl}/v1/jobs?limit=20`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has items': (r) => Array.isArray(r.json('items')),
  });
  sleep(1);
}
