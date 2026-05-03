import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    inbox_read: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.RATE ?? 100),
      timeUnit: '1s',
      duration: __ENV.DURATION ?? '1m',
      preAllocatedVUs: 50,
      maxVUs: 500,
    },
  },
  thresholds: {
    http_req_duration: ['p(99)<50'],
    http_req_failed: ['rate<0.01'],
  },
};

const baseUrl = __ENV.BASE_URL ?? 'http://127.0.0.1:3020';
const token = __ENV.JWT ?? '';

export default function () {
  const response = http.get(`${baseUrl}/v1/notifications?limit=20`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(0.1);
}
