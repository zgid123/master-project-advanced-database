import { describe, expect, it } from 'vitest';
import { createJobSchema, updateJobSchema } from '../../src/domain/jobs/job.types.js';

describe('job schemas', () => {
  it('applies create defaults and normalizes currency casing', () => {
    const parsed = createJobSchema.parse({
      name: 'Backend Engineer',
      content: 'Build and operate the job service.',
      currency: 'usd',
    });

    expect(parsed).toMatchObject({
      name: 'Backend Engineer',
      content: 'Build and operate the job service.',
      status: 'draft',
      currency: 'USD',
      tags: [],
      metadata: {},
    });
  });

  it('rejects updates that contain only the CAS precondition', () => {
    const parsed = updateJobSchema.safeParse({
      expected_status: 'open',
    });

    expect(parsed.success).toBe(false);
  });
});
