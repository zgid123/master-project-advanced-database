import { Int32, ObjectId, type ClientSession, type Collection, type Filter } from 'mongodb';
import { getDb } from '../../db/mongo.js';
import type { JobDoc } from '../jobs/job.types.js';
import { objectIdOrNull, parseObjectId } from '../object-id.js';
import type { KeysetCursor } from '../pagination.js';
import type {
  ApplicationDoc,
  ApplicationStatus,
  SubmitApplicationInput,
} from './application.types.js';

type ApplicationMutationTarget = Pick<ApplicationDoc, '_id' | 'jobId' | 'status' | 'denormalized'>;

async function applicationsCollection(): Promise<Collection<ApplicationDoc>> {
  return (await getDb()).collection<ApplicationDoc>('job_applications');
}

async function jobsCollection(): Promise<Collection<JobDoc>> {
  return (await getDb()).collection<JobDoc>('jobs');
}

function keysetFilter(cursor: KeysetCursor | null): Filter<ApplicationDoc> {
  if (!cursor) return {};

  return {
    $or: [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
    ],
  };
}

export const ApplicationRepo = {
  async findByIdempotency(
    applicantUserId: string,
    idempotencyKey: string,
  ): Promise<ApplicationDoc | null> {
    const applicantObjectId = objectIdOrNull(applicantUserId);
    if (!applicantObjectId) return null;

    const collection = await applicationsCollection();
    return collection.findOne({
      applicantUserId: applicantObjectId,
      idempotencyKey,
    });
  },

  async findOpenJob(session: ClientSession, jobId: string): Promise<JobDoc | null> {
    const _id = objectIdOrNull(jobId);
    if (!_id) return null;

    const collection = await jobsCollection();
    return collection.findOne(
      {
        _id,
        status: 'open',
        deletedAt: null,
      },
      { session },
    );
  },

  async createSubmitted(
    session: ClientSession,
    input: SubmitApplicationInput,
    job: Pick<JobDoc, '_id' | 'title' | 'postedByUserId'>,
  ): Promise<ApplicationDoc> {
    const collection = await applicationsCollection();
    const now = new Date();
    const doc: ApplicationDoc = {
      _id: new ObjectId(),
      jobId: parseObjectId(input.jobId, 'INVALID_JOB_ID'),
      applicantUserId: parseObjectId(input.applicantUserId, 'INVALID_USER_SUBJECT'),
      status: 'submitted',
      ...(input.coverLetter ? { coverLetter: input.coverLetter } : {}),
      ...(input.resumeUrl ? { resumeUrl: input.resumeUrl } : {}),
      idempotencyKey: input.idempotencyKey,
      denormalized: {
        jobTitle: job.title,
        jobPostedByUserId: job.postedByUserId,
      },
      metadata: input.metadata,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(doc, { session });
    return doc;
  },

  async incrementJobApplicationCount(session: ClientSession, jobId: string): Promise<boolean> {
    const _id = objectIdOrNull(jobId);
    if (!_id) return false;

    const collection = await jobsCollection();
    const result = await collection.updateOne(
      {
        _id,
        status: 'open',
        deletedAt: null,
      },
      {
        $inc: { applicationCount: 1 },
        $set: { updatedAt: new Date() },
      },
      { session },
    );

    return result.modifiedCount === 1;
  },

  async listForJob(
    jobId: string,
    status: ApplicationStatus | null,
    cursor: KeysetCursor | null,
    limit: number,
  ): Promise<ApplicationDoc[]> {
    const jobObjectId = objectIdOrNull(jobId);
    if (!jobObjectId) return [];

    const filter: Filter<ApplicationDoc> = {
      jobId: jobObjectId,
      deletedAt: null,
      ...keysetFilter(cursor),
    };

    if (status) {
      filter.status = status;
    }

    const collection = await applicationsCollection();
    return collection
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();
  },

  async listForUser(
    applicantUserId: string,
    cursor: KeysetCursor | null,
    limit: number,
  ): Promise<ApplicationDoc[]> {
    const applicantObjectId = objectIdOrNull(applicantUserId);
    if (!applicantObjectId) return [];

    const collection = await applicationsCollection();
    return collection
      .find({
        applicantUserId: applicantObjectId,
        deletedAt: null,
        ...keysetFilter(cursor),
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();
  },

  async updateStatusCAS(
    session: ClientSession,
    id: string,
    nextStatus: ApplicationStatus,
    expectedStatus: ApplicationStatus,
  ): Promise<ApplicationDoc | null> {
    const _id = objectIdOrNull(id);
    if (!_id) return null;

    const collection = await applicationsCollection();
    return collection.findOneAndUpdate(
      {
        _id,
        status: expectedStatus,
        deletedAt: null,
      },
      {
        $set: {
          status: nextStatus,
          updatedAt: new Date(),
          ...(nextStatus === 'withdrawn' ? { deletedAt: new Date() } : {}),
        },
      },
      {
        session,
        returnDocument: 'after',
      },
    );
  },

  async findStatusMutationTarget(id: string, session: ClientSession): Promise<ApplicationMutationTarget | null> {
    const _id = objectIdOrNull(id);
    if (!_id) return null;

    const collection = await applicationsCollection();
    return collection.findOne(
      {
        _id,
        deletedAt: null,
      },
      {
        session,
        projection: { _id: 1, jobId: 1, status: 1, denormalized: 1 },
      },
    );
  },

  async findJobPosterId(session: ClientSession, jobId: ObjectId): Promise<ObjectId | null> {
    const collection = await jobsCollection();
    const job = await collection.findOne(
      { _id: jobId, deletedAt: null },
      { session, projection: { postedByUserId: 1 } },
    );
    return job?.postedByUserId ?? null;
  },

  async appendEvent(
    session: ClientSession,
    topic: 'job.application.submitted' | 'job.application.withdrawn' | 'job.application.status_changed',
    payload: Record<string, unknown>,
  ): Promise<void> {
    const outbox = (await getDb()).collection('job_outbox');
    const now = new Date();
    await outbox.insertOne(
      {
        _id: new ObjectId(),
        topic,
        payload,
        status: 'pending',
        publishedAt: null,
        attempts: new Int32(0),
        createdAt: now,
        updatedAt: now,
      },
      { session },
    );
  },
};
