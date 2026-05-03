import { describe, expect, it } from 'vitest';
import { scheduledNotificationStatus, scheduledRetryDelaySeconds } from '../../src/workers/scheduled-status.js';

describe('scheduled notification status policy', () => {
  it('keeps status values explicit', () => {
    expect(scheduledNotificationStatus).toEqual({
      pending: 0,
      processing: 1,
      fired: 2,
      cancelled: 3,
      failed: 4,
    });
  });

  it('backs off retries exponentially with a one-hour cap', () => {
    expect(scheduledRetryDelaySeconds(1)).toBe(30);
    expect(scheduledRetryDelaySeconds(2)).toBe(60);
    expect(scheduledRetryDelaySeconds(8)).toBe(3_600);
    expect(scheduledRetryDelaySeconds(20)).toBe(3_600);
  });
});
