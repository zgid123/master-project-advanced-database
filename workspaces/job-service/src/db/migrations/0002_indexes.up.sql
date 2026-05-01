CREATE UNIQUE INDEX uq_jobs_slug ON jobs(slug);
CREATE UNIQUE INDEX uq_jobs_public_uid ON jobs(public_uid);

CREATE UNIQUE INDEX uq_job_applications_active
  ON job_applications(job_id, applicant_user_id)
  WHERE status NOT IN ('withdrawn', 'rejected');

CREATE UNIQUE INDEX uq_job_applications_idempotency
  ON job_applications(applicant_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_jobs_posted_by_user_id ON jobs(posted_by_user_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_user_id ON job_applications(applicant_user_id);

CREATE INDEX idx_jobs_user_status_created
  ON jobs(posted_by_user_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_job_apps_job_status_created
  ON job_applications(job_id, status, created_at DESC, id DESC);

CREATE INDEX idx_job_apps_user_created
  ON job_applications(applicant_user_id, created_at DESC, id DESC);

CREATE INDEX idx_jobs_open_recent
  ON jobs(created_at DESC, id DESC)
  WHERE status = 'open' AND deleted_at IS NULL;

CREATE INDEX idx_jobs_open_listing_covering
  ON jobs(status, created_at DESC, id DESC)
  INCLUDE (name, slug, location, salary_min, salary_max, currency, application_count)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_jobs_lower_name ON jobs(LOWER(name));

CREATE INDEX idx_jobs_metadata_company
  ON jobs((metadata->>'company'))
  WHERE deleted_at IS NULL;

CREATE INDEX idx_jobs_metadata_exp_years
  ON jobs(((metadata->>'experience_years')::INT))
  WHERE deleted_at IS NULL
    AND metadata ? 'experience_years'
    AND jsonb_typeof(metadata->'experience_years') = 'number';

CREATE INDEX idx_jobs_search_vector
  ON jobs USING GIN(search_vector);

CREATE INDEX idx_jobs_name_trgm
  ON jobs USING GIN(name gin_trgm_ops);

CREATE INDEX idx_jobs_metadata_path
  ON jobs USING GIN(metadata jsonb_path_ops);

CREATE INDEX idx_jobs_tags ON jobs USING GIN(tags);
