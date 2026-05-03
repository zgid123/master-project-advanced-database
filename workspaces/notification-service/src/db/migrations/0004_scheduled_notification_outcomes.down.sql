DROP INDEX IF EXISTS ix_sched_lease_expired;

COMMENT ON COLUMN scheduled_notifications.status IS NULL;

ALTER TABLE scheduled_notifications
  DROP COLUMN IF EXISTS last_error,
  DROP COLUMN IF EXISTS failed_at,
  DROP COLUMN IF EXISTS processed_at,
  DROP COLUMN IF EXISTS payload_version;
