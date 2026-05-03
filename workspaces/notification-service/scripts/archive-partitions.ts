import { Client } from 'pg';
import { config } from '../src/config.js';

const client = new Client({
  connectionString: config.directDatabaseUrl,
  application_name: 'notification-service-archive',
});

const retentionMonths = Number(process.env.NOTIFICATION_RETENTION_MONTHS ?? 6);

await client.connect();
try {
  const result = await client.query<{ partition_name: string; from_value: string; to_value: string }>(`
    SELECT
      child.relname AS partition_name,
      pg_get_expr(child.relpartbound, child.oid) AS bound,
      split_part(split_part(pg_get_expr(child.relpartbound, child.oid), '''', 2), '''', 1) AS from_value,
      split_part(split_part(pg_get_expr(child.relpartbound, child.oid), '''', 4), '''', 1) AS to_value
    FROM pg_inherits
    JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
    JOIN pg_class child ON pg_inherits.inhrelid = child.oid
    WHERE parent.relname IN ('notifications', 'notification_deliveries')
      AND child.relname NOT LIKE '%default'
    ORDER BY child.relname
  `);

  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - retentionMonths);

  for (const row of result.rows) {
    const toValue = new Date(row.to_value);
    if (Number.isNaN(toValue.getTime()) || toValue >= cutoff) continue;
    console.log(`eligible for archival: ${row.partition_name} (${row.from_value} to ${row.to_value})`);
  }

  console.log('No partitions were detached. Dump/detach is intentionally a manual runbook step for this prototype.');
} finally {
  await client.end();
}
