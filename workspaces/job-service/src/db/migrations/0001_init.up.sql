CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE TYPE job_status AS ENUM (
  'draft', 'open', 'closed', 'filled', 'expired', 'archived'
);

CREATE TYPE application_status AS ENUM (
  'submitted', 'under_review', 'shortlisted',
  'interviewed', 'accepted', 'rejected', 'withdrawn'
);

CREATE TYPE job_type AS ENUM (
  'full_time', 'part_time', 'contract', 'internship', 'freelance'
);

CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TABLE jobs (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_uid            UUID         NOT NULL DEFAULT gen_random_uuid(),
  posted_by_user_id     BIGINT       NOT NULL,
  name                  TEXT         NOT NULL,
  slug                  TEXT         NOT NULL,
  content               TEXT         NOT NULL,
  status                job_status   NOT NULL DEFAULT 'draft',
  job_type              job_type     NULL,
  location              TEXT         NULL,
  salary_min            NUMERIC(12,2) NULL,
  salary_max            NUMERIC(12,2) NULL,
  currency              CHAR(3)       NULL,
  tags                  TEXT[]        NOT NULL DEFAULT '{}',
  metadata              JSONB         NOT NULL DEFAULT '{}'::jsonb,
  view_count            BIGINT        NOT NULL DEFAULT 0,
  application_count     INTEGER       NOT NULL DEFAULT 0,
  search_vector         tsvector      GENERATED ALWAYS AS (
                          setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
                          setweight(to_tsvector('simple', coalesce(location, '')), 'B') ||
                          setweight(to_tsvector('simple', coalesce(content, '')), 'C')
                        ) STORED,
  valid_to              TIMESTAMPTZ   NULL,
  deleted_at            TIMESTAMPTZ   NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT jobs_slug_format_chk      CHECK (slug ~ '^[a-z0-9-]{3,160}$'),
  CONSTRAINT jobs_salary_range_chk     CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
  CONSTRAINT jobs_currency_with_salary CHECK (
    (salary_min IS NULL AND salary_max IS NULL) OR currency IS NOT NULL
  ),
  CONSTRAINT jobs_valid_to_future_chk  CHECK (valid_to IS NULL OR valid_to > created_at)
);

CREATE TRIGGER jobs_set_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TABLE job_applications (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id              BIGINT             NOT NULL,
  applicant_user_id   BIGINT             NOT NULL,
  status              application_status NOT NULL DEFAULT 'submitted',
  cover_letter        TEXT               NULL,
  resume_url          TEXT               NULL,
  content             TEXT               NULL,
  metadata            JSONB              NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key     TEXT               NULL,
  created_at          TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ        NOT NULL DEFAULT now(),

  CONSTRAINT job_applications_job_fk
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT job_applications_resume_url_chk
    CHECK (resume_url IS NULL OR resume_url ~ '^https?://')
);

CREATE TRIGGER job_applications_set_updated_at
BEFORE UPDATE ON job_applications
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
