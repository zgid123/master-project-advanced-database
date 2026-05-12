import { Int32, ObjectId, type ClientSession, type Collection, type Filter, type Sort } from 'mongodb';
import { getDb } from '../../db/mongo.js';
import type { KeysetCursor } from '../pagination.js';
import { objectIdOrNull, parseObjectId } from '../object-id.js';
import type { CreateJobInput, JobDoc, JobListDoc, JobSearchDoc, UpdateJobInput } from './job.types.js';

type JobMutationTarget = Pick<JobDoc, '_id' | 'postedByUserId' | 'status'>;

const updateFieldNames = ['title', 'content', 'status', 'jobType', 'location', 'tags', 'metadata'] as const;

async function jobsCollection(): Promise<Collection<JobDoc>> {
  return (await getDb()).collection<JobDoc>('jobs');
}

function keysetFilter(cursor: KeysetCursor | null): Filter<JobDoc> {
  if (!cursor) return {};

  return {
    $or: [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
    ],
  };
}

export const JobRepo = {
  async findById(id: string, session?: ClientSession): Promise<JobDoc | null> {
    const _id = objectIdOrNull(id);
    if (!_id) return null;

    const collection = await jobsCollection();
    return collection.findOne(
      { _id, deletedAt: null },
      session ? { session } : undefined,
    );
  },

  async findMutationTarget(id: string, session: ClientSession): Promise<JobMutationTarget | null> {
    const _id = objectIdOrNull(id);
    if (!_id) return null;

    const collection = await jobsCollection();
    return collection.findOne(
      { _id, deletedAt: null },
      {
        session,
        projection: { _id: 1, postedByUserId: 1, status: 1 },
      },
    );
  },

  async listOpenKeyset(cursor: KeysetCursor | null, limit: number): Promise<JobListDoc[]> {
    const collection = await jobsCollection();
    const filter: Filter<JobDoc> = {
      status: 'open',
      deletedAt: null,
      ...keysetFilter(cursor),
    };

    return collection
      .find(filter, {
        projection: {
          _id: 1,
          title: 1,
          location: 1,
          jobType: 1,
          status: 1,
          createdAt: 1,
          applicationCount: 1,
        },
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray() as Promise<JobListDoc[]>;
  },

  async fullTextSearch(
    q: string,
    location: string | null,
    type: string | null,
    limit: number,
  ): Promise<JobSearchDoc[]> {
    const collection = await jobsCollection();
    const filter: Filter<JobDoc> = {
      $text: { $search: q },
      status: 'open',
      deletedAt: null,
    };

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (type) {
      filter.jobType = type as NonNullable<JobDoc['jobType']>;
    }

    return collection
      .find(filter, {
        projection: {
          _id: 1,
          title: 1,
          location: 1,
          jobType: 1,
          status: 1,
          createdAt: 1,
          applicationCount: 1,
          score: { $meta: 'textScore' },
        },
      })
      .sort({ score: { $meta: 'textScore' }, createdAt: -1, _id: -1 } as Sort)
      .limit(limit)
      .toArray() as unknown as Promise<JobSearchDoc[]>;
  },

  async create(input: CreateJobInput, session: ClientSession): Promise<JobDoc> {
    const collection = await jobsCollection();
    const now = new Date();
    const doc: JobDoc = {
      _id: new ObjectId(),
      postedByUserId: parseObjectId(input.postedByUserId, 'INVALID_USER_SUBJECT'),
      title: input.title,
      content: input.content,
      location: input.location ?? null,
      jobType: input.jobType ?? null,
      status: input.status,
      tags: input.tags,
      applicationCount: new Int32(0) as unknown as number,
      metadata: input.metadata,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(doc, { session });
    return doc;
  },

  async updateCAS(
    id: string,
    patch: UpdateJobInput,
    session: ClientSession,
  ): Promise<JobDoc | null> {
    const _id = objectIdOrNull(id);
    if (!_id) return null;

    const $set: Partial<JobDoc> = {
      updatedAt: new Date(),
    };

    for (const field of updateFieldNames) {
      if (field in patch) {
        Object.assign($set, { [field]: patch[field] ?? null });
      }
    }

    const filter: Filter<JobDoc> = {
      _id,
      deletedAt: null,
    };

    if (patch.expectedStatus) {
      filter.status = patch.expectedStatus;
    }

    const collection = await jobsCollection();
    return collection.findOneAndUpdate(
      filter,
      { $set },
      {
        session,
        returnDocument: 'after',
      },
    );
  },

  async softDelete(id: string, session: ClientSession): Promise<JobDoc | null> {
    const _id = objectIdOrNull(id);
    if (!_id) return null;

    const now = new Date();
    const collection = await jobsCollection();
    return collection.findOneAndUpdate(
      { _id, deletedAt: null },
      { $set: { deletedAt: now, updatedAt: now } },
      {
        session,
        returnDocument: 'after',
      },
    );
  },

  async appendEvent(
    session: ClientSession,
    topic: 'job.created' | 'job.status_changed' | 'job.deleted',
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
