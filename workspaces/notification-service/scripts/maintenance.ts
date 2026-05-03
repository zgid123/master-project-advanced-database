import { Client } from 'pg';
import { config } from '../src/config.js';

const client = new Client({
  connectionString: config.directDatabaseUrl,
  application_name: 'notification-service-maintenance',
});

await client.connect();
try {
  await client.query('SELECT create_notification_partitions(current_date, $1)', [
    Number(process.env.NOTIFICATION_PARTITION_MONTHS_AHEAD ?? 6),
  ]);
  await client.query('SELECT create_notification_delivery_partitions(current_date, $1)', [
    Number(process.env.NOTIFICATION_DELIVERY_PARTITION_WEEKS_AHEAD ?? 12),
  ]);

  const inboxDedup = await client.query(`
    DELETE FROM notification_inbox_dedup
    WHERE consumed_at < now() - interval '30 days'
  `);
  const recipientDedup = await client.query(`
    DELETE FROM notification_recipient_dedup
    WHERE consumed_at < now() - interval '30 days'
  `);
  const inactiveDevices = await client.query(`
    DELETE FROM device_tokens
    WHERE is_active = false
      AND updated_at < now() - interval '90 days'
  `);

  console.log(JSON.stringify({
    partitions: 'ensured',
    deleted: {
      notification_inbox_dedup: inboxDedup.rowCount ?? 0,
      notification_recipient_dedup: recipientDedup.rowCount ?? 0,
      inactive_device_tokens: inactiveDevices.rowCount ?? 0,
    },
  }));
} finally {
  await client.end();
}
