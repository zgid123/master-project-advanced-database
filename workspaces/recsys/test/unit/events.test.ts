import { describe, expect, it } from 'vitest';

import {
  normalizeBodyToEvents,
  topicEventSchema,
  voteEventSchema,
} from '../../src/events/types.js';

describe('event normalization', () => {
  it('accepts blueprint vote envelopes with numeric voteType and ISO timestamps', () => {
    const [event] = normalizeBodyToEvents(voteEventSchema, {
      eventId: 'evt-1',
      eventType: 'vote.created',
      emittedAt: '2026-05-11T01:00:00.000Z',
      source: 'qa',
      schemaVersion: 1,
      payload: {
        userId: '101',
        targetType: 'topic',
        targetId: '202',
        voteType: 1,
        substackId: '303',
        votedAt: '2026-05-11T01:00:00.000Z',
      },
    });

    expect(event).toMatchObject({
      eventId: 'evt-1',
      type: 'vote.created',
      userId: '101',
      targetId: '202',
      voteType: 'up',
      substackId: '303',
      createdAt: 1778461200,
    });
  });

  it('maps topic.created envelopes to topic upserts', () => {
    const [event] = normalizeBodyToEvents(topicEventSchema, {
      eventId: 'evt-2',
      eventType: 'topic.created',
      emittedAt: '2026-05-11T01:00:00.000Z',
      payload: {
        topicId: '202',
        authorId: '101',
        substackId: '303',
        createdAt: '2026-05-11T01:00:00.000Z',
      },
    });

    expect(event).toMatchObject({
      eventId: 'evt-2',
      type: 'topic.upsert',
      topicId: '202',
      authorId: '101',
      substackId: '303',
    });
  });
});
