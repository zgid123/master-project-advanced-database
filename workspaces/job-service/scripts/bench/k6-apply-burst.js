import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    apply_burst: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.RATE ?? 50),
      timeUnit: '1s',
      duration: __ENV.DURATION ?? '30s',
      preAllocatedVUs: Number(__ENV.VUS ?? 50),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<250', 'p(99)<500'],
  },
};

const baseUrl = __ENV.BASE_URL ?? 'http://localhost:3010';
const jwt = __ENV.JWT;
const jobId = __ENV.JOB_ID ?? '1';

export default function () {
  const idem = `k6-${__VU}-${__ITER}-${Date.now()}`;
  const res = http.post(
    `${baseUrl}/v1/jobs/${jobId}/applications`,
    JSON.stringify({
      content: 'k6 benchmark application',
      metadata: { source: 'k6' },
    }),
    {
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idem,
        authorization: `Bearer ${jwt}`,
      },
    },
  );

  check(res, {
    'created or conflict': (r) => [201, 409, 429].includes(r.status),
  });
}
