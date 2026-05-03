import { describe, expect, it } from 'vitest';
import { HttpError } from '../../src/domain/errors.js';
import { decodeCursor, encodeCursor } from '../../src/domain/pagination.js';

describe('pagination cursors', () => {
  it('round-trips a keyset cursor through base64url JSON', () => {
    const createdAt = '2026-05-02T08:00:00.000Z';
    const cursor = encodeCursor({ id: '42', created_at: new Date(createdAt) });

    expect(decodeCursor(cursor)).toEqual({
      id: '42',
      createdAt,
    });
  });

  it('returns null when no cursor is provided', () => {
    expect(decodeCursor(undefined)).toBeNull();
  });

  it('throws a typed 400 error for malformed cursors', () => {
    try {
      decodeCursor('not-a-valid-cursor');
      throw new Error('expected decodeCursor to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).statusCode).toBe(400);
      expect((error as HttpError).code).toBe('INVALID_CURSOR');
    }
  });
});
