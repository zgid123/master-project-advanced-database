import { describe, expect, it } from 'vitest';
import { inQuietHours, localHourInTimezone } from '../../src/domain/inbox/notification.service.js';

describe('quiet hours timezone handling', () => {
  it('uses the user timezone instead of UTC', () => {
    const now = new Date('2026-05-03T16:00:00.000Z');

    expect(localHourInTimezone(now, 'Asia/Bangkok')).toBe(23);
    expect(inQuietHours(now, 22, 7, 'Asia/Bangkok')).toBe(true);
    expect(inQuietHours(now, 22, 7, 'UTC')).toBe(false);
  });
});
