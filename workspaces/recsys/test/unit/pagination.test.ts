import { describe, expect, it } from 'vitest';

import {
  decodeCursor,
  encodeCursor,
  isAfterCursor,
} from '../../src/recommendation/pagination.js';

describe('feed pagination cursor', () => {
  it('round-trips score and topic id', () => {
    const cursor = encodeCursor({ score: 1.25, id: 'topic-10' });
    expect(decodeCursor(cursor)).toEqual({ score: 1.25, id: 'topic-10' });
  });

  it('rejects malformed cursor values', () => {
    expect(() => decodeCursor('bad')).toThrow('Cursor is not valid');
  });

  it('applies score and id keyset ordering', () => {
    const cursor = { score: 2, id: 'topic-2' };

    expect(isAfterCursor({ score: 1.9, topicId: 'topic-1' }, cursor)).toBe(
      true,
    );
    expect(isAfterCursor({ score: 2, topicId: 'topic-3' }, cursor)).toBe(true);
    expect(isAfterCursor({ score: 2.1, topicId: 'topic-1' }, cursor)).toBe(
      false,
    );
  });
});
