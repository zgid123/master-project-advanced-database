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

ALTER TABLE notifications
  ALTER COLUMN public_id SET DEFAULT uuidv7();
