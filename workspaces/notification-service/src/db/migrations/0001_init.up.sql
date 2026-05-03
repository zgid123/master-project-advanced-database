CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION uuidv7()
RETURNS uuid
LANGUAGE sql
VOLATILE
AS $$
  WITH value AS (
    SELECT
      lpad(to_hex(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint), 12, '0') AS unix_ms_hex,
      gen_random_bytes(10) AS random_bytes
  )
  SELECT (
    substr(unix_ms_hex, 1, 8) || '-' ||
    substr(unix_ms_hex, 9, 4) || '-' ||
    '7' || substr(encode(random_bytes, 'hex'), 1, 3) || '-' ||
    lpad(to_hex((get_byte(random_bytes, 2) & 63) | 128), 2, '0') ||
    substr(encode(random_bytes, 'hex'), 7, 2) || '-' ||
    substr(encode(random_bytes, 'hex'), 9, 12)
  )::uuid
  FROM value;
$$;

CREATE TABLE notification_channels (
  id SMALLINT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_categories (
  id SMALLINT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  default_channels SMALLINT[] NOT NULL DEFAULT ARRAY[1]::SMALLINT[],
  importance SMALLINT NOT NULL DEFAULT 50 CHECK (importance BETWEEN 0 AND 100),
  is_transactional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON notification_categories
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE notification_templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id SMALLINT NOT NULL REFERENCES notification_categories(id),
  channel_id SMALLINT NOT NULL REFERENCES notification_channels(id),
  locale TEXT NOT NULL DEFAULT 'en',
  version INTEGER NOT NULL DEFAULT 1,
  subject TEXT,
  body TEXT NOT NULL,
  body_html TEXT,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, channel_id, locale, version)
);

CREATE INDEX ix_templates_lookup
  ON notification_templates (category_id, channel_id, locale, is_active)
  WHERE is_active = true;

CREATE TRIGGER trg_templates_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE notification_preferences (
  user_id BIGINT NOT NULL,
  category_id SMALLINT NOT NULL REFERENCES notification_categories(id),
  channel_id SMALLINT NOT NULL REFERENCES notification_channels(id),
  enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start SMALLINT CHECK (quiet_hours_start BETWEEN 0 AND 23),
  quiet_hours_end SMALLINT CHECK (quiet_hours_end BETWEEN 0 AND 23),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category_id, channel_id)
) WITH (fillfactor = 80);

CREATE INDEX ix_prefs_user ON notification_preferences (user_id);

CREATE TRIGGER trg_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE device_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  token TEXT NOT NULL,
  app_version TEXT,
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, token)
) WITH (fillfactor = 85);

CREATE INDEX ix_device_tokens_user_active
  ON device_tokens (user_id)
  WHERE is_active = true;

CREATE TRIGGER trg_device_tokens_updated_at
BEFORE UPDATE ON device_tokens
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  public_id UUID NOT NULL DEFAULT uuidv7(),
  user_id BIGINT NOT NULL,
  category_id SMALLINT NOT NULL REFERENCES notification_categories(id),
  template_id BIGINT REFERENCES notification_templates(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  archived BOOLEAN NOT NULL DEFAULT false,
  source_service TEXT,
  source_type TEXT,
  source_id BIGINT,
  actor_user_id BIGINT,
  dedup_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE notifications_default PARTITION OF notifications DEFAULT;
ALTER TABLE notifications_default SET (fillfactor = 80);

CREATE INDEX ix_notif_user_created
  ON notifications (user_id, created_at DESC, id DESC)
  WHERE archived = false;

CREATE INDEX ix_notif_user_unread
  ON notifications (user_id, created_at DESC, id DESC)
  WHERE read = false AND archived = false;

CREATE INDEX ix_notif_user_cat
  ON notifications (user_id, category_id, created_at DESC, id DESC)
  WHERE archived = false;

CREATE INDEX ix_notif_user_public
  ON notifications (user_id, public_id);

CREATE INDEX brin_notif_created
  ON notifications USING BRIN (created_at) WITH (pages_per_range = 32);

CREATE TABLE notification_recipient_dedup (
  user_id BIGINT NOT NULL,
  dedup_key TEXT NOT NULL,
  notification_id BIGINT,
  notification_created_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dedup_key)
) WITH (fillfactor = 90);

CREATE INDEX ix_recipient_dedup_consumed_at
  ON notification_recipient_dedup (consumed_at);

CREATE TABLE notification_deliveries (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  notification_id BIGINT NOT NULL,
  notification_created_at TIMESTAMPTZ NOT NULL,
  user_id BIGINT NOT NULL,
  channel_id SMALLINT NOT NULL REFERENCES notification_channels(id),
  status SMALLINT NOT NULL,
  attempt SMALLINT NOT NULL DEFAULT 1,
  provider TEXT,
  provider_msg_id TEXT,
  error_code TEXT,
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE notification_deliveries_default PARTITION OF notification_deliveries DEFAULT;
ALTER TABLE notification_deliveries_default SET (fillfactor = 90);

CREATE INDEX ix_deliv_notif
  ON notification_deliveries (notification_id, channel_id);

CREATE INDEX ix_deliv_user_recent
  ON notification_deliveries (user_id, created_at DESC);

CREATE INDEX brin_deliv_created
  ON notification_deliveries USING BRIN (created_at) WITH (pages_per_range = 32);

CREATE INDEX ix_deliv_status_failed
  ON notification_deliveries (status, created_at)
  WHERE status = 6;

CREATE TABLE notification_batches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('daily_digest', 'weekly_digest')),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  status SMALLINT NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX ix_batches_user_window
  ON notification_batches (user_id, window_start);

CREATE TABLE notification_batch_items (
  batch_id BIGINT NOT NULL REFERENCES notification_batches(id) ON DELETE CASCADE,
  notification_id BIGINT NOT NULL,
  notification_created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (batch_id, notification_id)
);

CREATE TABLE scheduled_notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  category_id SMALLINT NOT NULL REFERENCES notification_categories(id),
  payload JSONB NOT NULL,
  fire_at TIMESTAMPTZ NOT NULL,
  status SMALLINT NOT NULL DEFAULT 0,
  locked_by TEXT,
  locked_until TIMESTAMPTZ,
  attempts SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
) WITH (fillfactor = 80);

CREATE INDEX ix_sched_due
  ON scheduled_notifications (fire_at)
  WHERE status = 0;

CREATE TRIGGER trg_scheduled_updated_at
BEFORE UPDATE ON scheduled_notifications
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE notification_inbox_dedup (
  event_id TEXT PRIMARY KEY,
  source_service TEXT NOT NULL,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_dedup_consumed_at
  ON notification_inbox_dedup (consumed_at);

CREATE TABLE notification_outbox (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  last_error TEXT
) WITH (fillfactor = 90);

CREATE INDEX ix_outbox_unpublished
  ON notification_outbox (id)
  WHERE published_at IS NULL;

CREATE OR REPLACE FUNCTION create_notification_partitions(p_start DATE, p_months INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER;
  month_start DATE;
  month_end DATE;
  suffix TEXT;
  table_name TEXT;
BEGIN
  FOR i IN 0..GREATEST(p_months - 1, 0) LOOP
    month_start := (date_trunc('month', p_start)::date + (i || ' month')::interval)::date;
    month_end := (month_start + interval '1 month')::date;
    suffix := to_char(month_start, 'YYYY_MM');
    table_name := 'notifications_' || suffix;

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF notifications FOR VALUES FROM (%L) TO (%L)',
      table_name,
      month_start,
      month_end
    );
    EXECUTE format('ALTER TABLE %I SET (fillfactor = 80)', table_name);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION create_notification_delivery_partitions(p_start DATE, p_weeks INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER;
  week_start DATE;
  week_end DATE;
  suffix TEXT;
  table_name TEXT;
BEGIN
  FOR i IN 0..GREATEST(p_weeks - 1, 0) LOOP
    week_start := (date_trunc('week', p_start)::date + (i || ' week')::interval)::date;
    week_end := (week_start + interval '1 week')::date;
    suffix := to_char(week_start, 'IYYY_IW');
    table_name := 'notification_deliveries_' || suffix;

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF notification_deliveries FOR VALUES FROM (%L) TO (%L)',
      table_name,
      week_start,
      week_end
    );
    EXECUTE format('ALTER TABLE %I SET (fillfactor = 90)', table_name);
  END LOOP;
END;
$$;

SELECT create_notification_partitions(current_date, 3);
SELECT create_notification_delivery_partitions(current_date, 8);
