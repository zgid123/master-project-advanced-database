ALTER TABLE scheduled_notifications
  ADD COLUMN IF NOT EXISTS payload_version SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

COMMENT ON COLUMN scheduled_notifications.status IS
  '0=pending, 1=processing, 2=fired, 3=cancelled, 4=failed';

CREATE INDEX IF NOT EXISTS ix_sched_lease_expired
  ON scheduled_notifications (locked_until)
  WHERE status = 1;
