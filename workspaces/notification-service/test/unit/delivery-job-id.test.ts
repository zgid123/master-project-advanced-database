import { describe, expect, it } from 'vitest';
import { deliveryJobId } from '../../src/workers/job-ids.js';

describe('deliveryJobId', () => {
  it('does not include BullMQ separator characters from ISO timestamps', () => {
    expect(deliveryJobId({
      channel_code: 'email',
      notification_id: '123',
      notification_created_at: '2026-05-03T07:55:05.850Z',
    })).toBe('email-123-1777794905850');
  });
});
