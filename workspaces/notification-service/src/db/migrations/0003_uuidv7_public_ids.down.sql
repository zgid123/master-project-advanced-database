ALTER TABLE notifications
  ALTER COLUMN public_id SET DEFAULT gen_random_uuid();
