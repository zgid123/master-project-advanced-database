import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor } from '../../src/domain/pagination.js';
import { HttpError } from '../../src/domain/errors.js';

describe('notification keyset cursors', () => {
  it('round-trips created_at and id', () => {
    const cursor = encodeCursor({
      created_at: new Date('2026-05-03T01:02:03.000Z'),
      id: '123',
    });

    expect(decodeCursor(cursor)).toEqual({
      createdAt: '2026-05-03T01:02:03.000Z',
      id: '123',
    });
  });

  it('throws a typed error for invalid cursors', () => {
    expect(() => decodeCursor('not-valid')).toThrow(HttpError);
  });
});
