import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { HttpError } from '../../src/domain/errors.js';
import { decodeCursor, encodeCursor } from '../../src/domain/pagination.js';

describe('pagination cursors', () => {
  it('round-trips a keyset cursor through base64url JSON', () => {
    const createdAt = '2026-05-02T08:00:00.000Z';
    const _id = new ObjectId('664c4e9a5a3b2c7d1e0a1f88');
    const cursor = encodeCursor({ _id, createdAt: new Date(createdAt) });

    const decoded = decodeCursor(cursor);
    expect(decoded?.createdAt.toISOString()).toBe(createdAt);
    expect(decoded?._id.toHexString()).toBe(_id.toHexString());
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
