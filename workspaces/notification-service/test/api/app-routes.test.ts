import { createHmac } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/domain/inbox/notification.service.js', () => ({
  NotificationService: {
    archive: vi.fn(),
    ingest: vi.fn(),
    list: vi.fn(),
    markAllRead: vi.fn(),
    markRead: vi.fn(),
    unreadCount: vi.fn(),
  },
}));

vi.mock('../../src/domain/preferences/preference.service.js', () => ({
  PreferenceService: {
    list: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../../src/domain/devices/device.service.js', () => ({
  DeviceService: {
    deactivate: vi.fn(),
    list: vi.fn(),
    register: vi.fn(),
  },
}));

import { buildApp } from '../../src/app.js';
import { DeviceService } from '../../src/domain/devices/device.service.js';
import { NotificationService } from '../../src/domain/inbox/notification.service.js';
import { PreferenceService } from '../../src/domain/preferences/preference.service.js';

const now = new Date('2026-05-03T08:00:00.000Z');

describe('notification-service HTTP API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  function bearerToken(sub: string): string {
    const encodedHeader = base64urlJson({ alg: 'HS256', typ: 'JWT' });
    const encodedPayload = base64urlJson({ sub });
    const signature = createHmac('sha256', 'dev-secret')
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `Bearer ${encodedHeader}.${encodedPayload}.${signature}`;
  }

  it('redirects root to Swagger UI and exposes OpenAPI JSON', async () => {
    const root = await app.inject({ method: 'GET', url: '/' });
    expect(root.statusCode).toBe(302);
    expect(root.headers.location).toBe('/docs');

    const docs = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(docs.statusCode).toBe(200);
    expect(docs.json()).toMatchObject({
      info: { title: 'Notification Service API' },
      paths: expect.objectContaining({
        '/v1/notifications': expect.any(Object),
        '/internal/notifications/events': expect.any(Object),
      }),
    });
  });

  it('lists notifications for the authenticated user', async () => {
    vi.mocked(NotificationService.list).mockResolvedValue({
      items: [{
        id: '1',
        public_id: '8f9a7ad7-9bb3-43cc-9f70-473aa0f735eb',
        user_id: '501',
        category_id: 1,
        category_code: 'new_comment',
        template_id: null,
        title: 'New comment',
        body: 'A comment was added',
        read: false,
        read_at: null,
        archived: false,
        source_service: 'comments',
        source_type: 'comment',
        source_id: '10',
        actor_user_id: '700',
        dedup_key: 'comment:10:501',
        metadata: {},
        created_at: now,
        updated_at: now,
      }],
      next_cursor: null,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/notifications?limit=1&filter=unread',
      headers: { authorization: bearerToken('501') },
    });

    expect(response.statusCode).toBe(200);
    expect(NotificationService.list).toHaveBeenCalledWith('501', null, 1, 'unread');
    expect(response.json()).toMatchObject({
      items: [{ title: 'New comment', category_code: 'new_comment' }],
      next_cursor: null,
    });
  });

  it('rejects protected inbox routes without a JWT', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/notifications',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: 'UNAUTHORIZED' });
    expect(NotificationService.list).not.toHaveBeenCalled();
  });

  it('marks all notifications read', async () => {
    vi.mocked(NotificationService.markAllRead).mockResolvedValue({ updated: 3 });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/notifications/mark-all-read',
      headers: { authorization: bearerToken('501') },
    });

    expect(response.statusCode).toBe(200);
    expect(NotificationService.markAllRead).toHaveBeenCalledWith('501');
    expect(response.json()).toEqual({ updated: 3 });
  });

  it('ingests internal notification events with an internal token', async () => {
    vi.mocked(NotificationService.ingest).mockResolvedValue({
      duplicate_event: false,
      inserted: [],
      skipped_recipients: 0,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/internal/notifications/events',
      headers: {
        'x-internal-token': 'dev-internal-token',
      },
      payload: {
        event_id: 'evt-1',
        source_service: 'comments',
        source_type: 'comment',
        source_id: 10,
        category_code: 'new_comment',
        recipients: [{ user_id: 501 }],
        data: { actor_name: 'Nghia', topic_title: 'Indexes' },
      },
    });

    expect(response.statusCode).toBe(202);
    expect(NotificationService.ingest).toHaveBeenCalledWith(expect.objectContaining({
      event_id: 'evt-1',
      recipients: [{ user_id: '501' }],
    }));
  });

  it('rejects internal ingestion without the internal token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/internal/notifications/events',
      payload: {
        event_id: 'evt-1',
        source_service: 'comments',
        category_code: 'new_comment',
        recipients: [{ user_id: 501 }],
      },
    });

    expect(response.statusCode).toBe(401);
    expect(NotificationService.ingest).not.toHaveBeenCalled();
  });

  it('updates preferences for the authenticated user', async () => {
    vi.mocked(PreferenceService.put).mockResolvedValue([]);

    const response = await app.inject({
      method: 'PUT',
      url: '/v1/preferences',
      headers: { authorization: bearerToken('501') },
      payload: {
        preferences: [{
          category_code: 'new_comment',
          channel_code: 'email',
          enabled: false,
          timezone: 'Asia/Bangkok',
        }],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(PreferenceService.put).toHaveBeenCalledWith('501', [expect.objectContaining({
      category_code: 'new_comment',
      channel_code: 'email',
      enabled: false,
    })]);
  });

  it('registers a device token', async () => {
    vi.mocked(DeviceService.register).mockResolvedValue({
      id: '10',
      user_id: '501',
      platform: 'web',
      token: 'token-token-token',
      app_version: null,
      device_info: {},
      last_seen_at: now,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/devices',
      headers: { authorization: bearerToken('501') },
      payload: {
        platform: 'web',
        token: 'token-token-token',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(DeviceService.register).toHaveBeenCalledWith(expect.objectContaining({
      user_id: '501',
      platform: 'web',
    }));
  });
});

function base64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
