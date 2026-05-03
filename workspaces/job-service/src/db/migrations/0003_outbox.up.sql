CREATE TABLE event_outbox (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ NULL,
  last_error TEXT NULL
);

CREATE INDEX idx_event_outbox_unsent
  ON event_outbox(id)
  WHERE sent_at IS NULL;
