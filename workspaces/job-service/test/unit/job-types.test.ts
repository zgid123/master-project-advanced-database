import { describe, expect, it } from 'vitest';
import { createJobSchema, updateJobSchema } from '../../src/domain/jobs/job.types.js';

describe('job schemas', () => {
  it('applies create defaults', () => {
    const parsed = createJobSchema.parse({
      title: 'Backend Engineer',
      content: 'Build and operate the job service.',
    });

    expect(parsed).toMatchObject({
      title: 'Backend Engineer',
      content: 'Build and operate the job service.',
      status: 'draft',
      tags: [],
      metadata: {},
    });
  });

  it('rejects updates that contain only the CAS precondition', () => {
    const parsed = updateJobSchema.safeParse({
      expectedStatus: 'open',
    });

    expect(parsed.success).toBe(false);
  });
});
