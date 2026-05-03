import { Client } from 'pg';
import { config } from '../src/config.js';

const client = new Client({
  connectionString: config.directDatabaseUrl,
  application_name: 'notification-service-seed',
});

const channels = [
  [1, 'in_app', 'In-App'],
  [2, 'email', 'Email'],
  [3, 'web_push', 'Web Push'],
  [4, 'mobile_push', 'Mobile Push'],
  [5, 'sms', 'SMS'],
] as const;

const categories = [
  [1, 'new_comment', 'New Comment', 'A followed topic receives a new comment', [1, 2, 3], 60, false],
  [2, 'new_topic', 'New Topic', 'A followed substack receives a new topic', [1, 3], 45, false],
  [3, 'vote_received', 'Vote Received', 'A topic or comment receives a vote', [1], 35, false],
  [4, 'mention', 'Mention', 'A user is mentioned in content', [1, 2, 3, 4], 80, false],
  [5, 'job_application_update', 'Job Application Update', 'A job application changes status', [1, 2], 85, true],
  [6, 'substack_invitation', 'Substack Invitation', 'A user is invited to a substack role', [1, 2], 70, false],
  [7, 'digest', 'Digest', 'Daily or weekly digest summary', [2], 25, false],
] as const;

const templates = [
  ['new_comment', 'in_app', 'en', '{{actor_name}} commented on {{topic_title}}', '{{actor_name}} commented: {{snippet}}'],
  ['new_comment', 'email', 'en', 'New comment on {{topic_title}}', '<p>{{actor_name}} commented on <strong>{{topic_title}}</strong>.</p><p>{{snippet}}</p>'],
  ['new_topic', 'in_app', 'en', 'New topic in {{substack_name}}', '{{actor_name}} posted {{topic_title}}'],
  ['vote_received', 'in_app', 'en', 'You received a vote', '{{actor_name}} {{vote_type}}voted your {{target_type}}'],
  ['mention', 'in_app', 'en', '{{actor_name}} mentioned you', '{{actor_name}} mentioned you in {{source_type}}'],
  ['mention', 'email', 'en', 'You were mentioned on Solvit', '<p>{{actor_name}} mentioned you in {{source_type}}.</p>'],
  ['job_application_update', 'in_app', 'en', 'Application update', 'Your application for {{job_name}} is now {{status}}'],
  ['job_application_update', 'email', 'en', 'Application update for {{job_name}}', '<p>Your application status is now <strong>{{status}}</strong>.</p>'],
  ['substack_invitation', 'in_app', 'en', 'Substack invitation', 'You were invited to join {{substack_name}} as {{role_name}}'],
  ['digest', 'email', 'en', 'Your Solvit digest', '<p>You have {{item_count}} unread notifications.</p>'],
  ['new_comment', 'in_app', 'vi', '{{actor_name}} đã bình luận về {{topic_title}}', '{{actor_name}} bình luận: {{snippet}}'],
  ['mention', 'in_app', 'vi', '{{actor_name}} đã nhắc đến bạn', '{{actor_name}} đã nhắc đến bạn trong {{source_type}}'],
] as const;

await client.connect();
try {
  await client.query('BEGIN');

  for (const [id, code, displayName] of channels) {
    await client.query(
      `
        INSERT INTO notification_channels(id, code, display_name)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE
        SET code = EXCLUDED.code,
            display_name = EXCLUDED.display_name,
            is_active = true
      `,
      [id, code, displayName],
    );
  }

  for (const [id, code, displayName, description, defaultChannels, importance, isTransactional] of categories) {
    await client.query(
      `
        INSERT INTO notification_categories(
          id, code, display_name, description, default_channels, importance, is_transactional
        )
        VALUES ($1, $2, $3, $4, $5::smallint[], $6, $7)
        ON CONFLICT (id) DO UPDATE
        SET code = EXCLUDED.code,
            display_name = EXCLUDED.display_name,
            description = EXCLUDED.description,
            default_channels = EXCLUDED.default_channels,
            importance = EXCLUDED.importance,
            is_transactional = EXCLUDED.is_transactional
      `,
      [id, code, displayName, description, defaultChannels, importance, isTransactional],
    );
  }

  for (const [categoryCode, channelCode, locale, subject, body] of templates) {
    await client.query(
      `
        INSERT INTO notification_templates(category_id, channel_id, locale, version, subject, body, is_active)
        SELECT c.id, ch.id, $3, 1, $4, $5, true
        FROM notification_categories c
        JOIN notification_channels ch ON ch.code = $2
        WHERE c.code = $1
        ON CONFLICT (category_id, channel_id, locale, version) DO UPDATE
        SET subject = EXCLUDED.subject,
            body = EXCLUDED.body,
            is_active = true
      `,
      [categoryCode, channelCode, locale, subject, body],
    );
  }

  await client.query('COMMIT');
  console.log('notification seed data applied');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
