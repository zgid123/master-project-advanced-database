import { Client } from 'pg';
import { config } from '../src/config.js';

const client = new Client({
  connectionString: config.directDatabaseUrl,
  application_name: 'notification-service-maintenance',
});

async function deleteInBatches(sql: string, batchSize: number): Promise<number> {
  let total = 0;

  while (true) {
    const result = await client.query<{ deleted: string }>(sql, [batchSize]);
    const deleted = Number(result.rows[0]?.deleted ?? 0);
    total += deleted;

    if (deleted < batchSize) return total;
  }
}

await client.connect();
try {
  const cleanupBatchSize = Math.max(1, Number(process.env.NOTIFICATION_CLEANUP_BATCH_SIZE ?? 5_000));

  await client.query('SELECT create_notification_partitions(current_date, $1)', [
    Number(process.env.NOTIFICATION_PARTITION_MONTHS_AHEAD ?? 6),
  ]);
  await client.query('SELECT create_notification_delivery_partitions(current_date, $1)', [
    Number(process.env.NOTIFICATION_DELIVERY_PARTITION_WEEKS_AHEAD ?? 12),
  ]);

  const inboxDedup = await deleteInBatches(`
    WITH deleted AS (
      DELETE FROM notification_inbox_dedup
      WHERE ctid IN (
        SELECT ctid
        FROM notification_inbox_dedup
        WHERE consumed_at < now() - interval '30 days'
        ORDER BY consumed_at
        LIMIT $1
      )
      RETURNING 1
    )
    SELECT count(*) AS deleted FROM deleted
  `, cleanupBatchSize);
  const recipientDedup = await deleteInBatches(`
    WITH deleted AS (
      DELETE FROM notification_recipient_dedup
      WHERE ctid IN (
        SELECT ctid
        FROM notification_recipient_dedup
        WHERE consumed_at < now() - interval '30 days'
        ORDER BY consumed_at
        LIMIT $1
      )
      RETURNING 1
    )
    SELECT count(*) AS deleted FROM deleted
  `, cleanupBatchSize);
  const inactiveDevices = await deleteInBatches(`
    WITH deleted AS (
      DELETE FROM device_tokens
      WHERE ctid IN (
        SELECT ctid
        FROM device_tokens
        WHERE is_active = false
          AND updated_at < now() - interval '90 days'
        ORDER BY updated_at
        LIMIT $1
      )
      RETURNING 1
    )
    SELECT count(*) AS deleted FROM deleted
  `, cleanupBatchSize);

  console.log(JSON.stringify({
    partitions: 'ensured',
    cleanup_batch_size: cleanupBatchSize,
    deleted: {
      notification_inbox_dedup: inboxDedup,
      notification_recipient_dedup: recipientDedup,
      inactive_device_tokens: inactiveDevices,
    },
  }));
} finally {
  await client.end();
}
