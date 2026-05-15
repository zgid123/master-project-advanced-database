import 'dotenv/config';

import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { faker } from '@faker-js/faker';
import mongoose, {
  type HydratedDocument,
  model,
  Schema,
  Types,
} from 'mongoose';
import { Client as PgClient } from 'pg';
import slugify from 'slugify';

const TOTAL_TOPICS = 500000;
const BATCH_SIZE = 1000;
const PUBLIC_TOPIC_RATIO = 0.85;

const ELASTICSEARCH_NODE =
  process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || 'topics';

interface Topic {
  _id?: Types.ObjectId;
  title: string;
  body: string;
  slug: string;
  is_solved: boolean;
  user_id: string;
  substack_id?: string;
  created_at: Date;
  updated_at: Date;
}

type TOpicDoc = HydratedDocument<Topic> & { _id: Types.ObjectId };

const TopicSchema = new Schema<Topic>(
  {
    title: { type: String, required: true },
    body: { type: String },
    slug: { type: String, required: true },
    is_solved: { type: Boolean, default: false },
    user_id: { type: String, required: true, index: true },
    substack_id: { type: String },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

TopicSchema.index({ slug: 1 }, { unique: true });
TopicSchema.index({ title: 'text' });
TopicSchema.index({ created_at: -1 });
TopicSchema.index({ user_id: 1 });

const TopicModel = model<Topic>('Topic', TopicSchema);

interface Comment {
  topic_id: string;
  user_id: string;
  content: string;
  is_accepted: boolean;
  created_at: Date;
  updated_at: Date;
}

const CommentSchema = new Schema<Comment>(
  {
    topic_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    content: { type: String },
    is_accepted: { type: Boolean, default: false },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

const CommentModel = model<Comment>('Comment', CommentSchema);

/* =========================
   CLIENTS
========================= */

const pgClient = new PgClient({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const elastic = new ElasticsearchClient({
  node: ELASTICSEARCH_NODE,
});

/* =========================
   UTILS
========================= */

const randomItem = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const slugSet = new Set<string>();

function generateSlug(title: string) {
  while (true) {
    const s =
      slugify(title, { lower: true, strict: true }) +
      '-' +
      faker.string.alphanumeric(8).toLowerCase();

    if (!slugSet.has(s)) {
      slugSet.add(s);
      return s;
    }
  }
}

/* =========================
   POSTGRES FETCH
========================= */

async function fetchUsers(): Promise<string[]> {
  const res = await pgClient.query('SELECT id FROM users');

  if (!res.rows.length) {
    throw new Error('No users found in PostgreSQL');
  }

  return res.rows.map((r) => r.id);
}

async function fetchSubstacks(): Promise<string[]> {
  const res = await pgClient.query('SELECT id FROM substacks');

  if (!res.rows.length) {
    throw new Error('No substacks found in PostgreSQL');
  }

  return res.rows.map((r) => r.id);
}

/* =========================
   DIVERSITY GENERATION
========================= */

function generateTitle() {
  const templates = [
    () =>
      `How to ${faker.hacker.verb()} ${faker.hacker.noun()} in ${faker.hacker.abbreviation()} (${faker.lorem.words(2)})?`,
    () =>
      `Error: ${faker.hacker.noun()} ${faker.hacker.verb()} failed in ${faker.system.fileName()} - ${faker.lorem.words(3)}`,
    () =>
      `Why does my ${faker.hacker.abbreviation()} ${faker.hacker.noun()} return ${faker.hacker.adjective()} for ${faker.lorem.word()}?`,
    () =>
      `Best way to implement ${faker.hacker.adjective()} ${faker.hacker.noun()} in ${faker.hacker.abbreviation()} (${faker.lorem.words(2)})`,
    () =>
      `Difference between ${faker.hacker.abbreviation()} and ${faker.hacker.abbreviation()} for ${faker.hacker.ingverb()} ${faker.lorem.word()}`,
    () =>
      `Cannot ${faker.hacker.verb()} ${faker.hacker.noun()}: ${faker.hacker.phrase()} (${faker.lorem.words(2)})`,
    () =>
      `What is the role of ${faker.hacker.noun()} in ${faker.hacker.abbreviation()} during ${faker.lorem.word()}?`,
    () =>
      `Resolving "${faker.hacker.phrase()}" error in ${faker.hacker.abbreviation()} for ${faker.lorem.word()}`,
    () =>
      `Is it possible to ${faker.hacker.verb()} ${faker.hacker.noun()} using ${faker.company.name()} API for ${faker.lorem.word()}?`,
    () =>
      `${faker.hacker.abbreviation()} issue: ${faker.lorem.sentence().replace('.', '?')}`,
  ];

  return randomItem(templates)();
}

function generateBody() {
  const errorLog =
    Math.random() > 0.5
      ? `\n\nError log:\n\`\`\`\n${faker.hacker.phrase()}\n${faker.system.filePath()} at line ${faker.number.int({ min: 1, max: 1000 })}\n\`\`\`\n`
      : '';
  const codeSnippet =
    Math.random() > 0.5
      ? `\n\nHere is my code:\n\`\`\`javascript\nconst ${faker.hacker.noun()} = new ${faker.hacker.abbreviation()}();\n${faker.hacker.noun()}.${faker.hacker.verb()}(${faker.number.int()});\n\`\`\`\n`
      : '';

  return (
    faker.lorem.paragraphs(faker.number.int({ min: 1, max: 5 })) +
    errorLog +
    codeSnippet
  );
}

function generateCommentBody() {
  const templates = [
    () =>
      `Have you tried ${faker.hacker.ingverb()} the ${faker.hacker.noun()}?`,
    () =>
      `Check your \`${faker.system.fileName()}\` file for any syntax errors.`,
    () =>
      `This looks like a bug in ${faker.hacker.abbreviation()}. Try upgrading to the latest version.`,
    () => faker.lorem.sentence(),
    () =>
      `Here is a link to the docs: https://${faker.internet.domainName()}/docs/${faker.lorem.word()}`,
    () => `Try running \`${faker.hacker.verb()} --${faker.hacker.noun()}\`.`,
    () =>
      `I get the same error when I ${faker.hacker.verb()} my ${faker.hacker.noun()}.`,
    () =>
      `The issue is with your ${faker.hacker.adjective()} ${faker.hacker.noun()}. You need to ${faker.hacker.verb()} it first.`,
    () => `Awesome, thanks! This solved my problem.`,
    () =>
      `Could you provide more details? What version of ${faker.hacker.abbreviation()} are you using?`,
  ];
  return randomItem(templates)();
}

/* =========================
   ELASTICSEARCH
========================= */

async function ensureIndex() {
  try {
    await elastic.indices.delete({ index: ELASTICSEARCH_INDEX });
  } catch (_) {}

  await elastic.indices.create({
    index: ELASTICSEARCH_INDEX,
    mappings: {
      properties: {
        title: { type: 'text' },
        body: { type: 'text' },
        substack_id: { type: 'keyword' },
        created_at: { type: 'date' },
      },
    },
  });
}

async function bulkIndex(docs: TOpicDoc[]) {
  const index = ELASTICSEARCH_INDEX;

  const ops = docs.flatMap((d) => [
    {
      index: {
        _index: index,
        _id: d._id.toString(),
      },
    },
    {
      title: d.title,
      body: d.body,
      substack_id: d.substack_id ?? null,
      created_at: d.created_at,
    },
  ]);

  const res = await elastic.bulk({ operations: ops });

  if (res.errors) {
    throw new Error('Bulk indexing failed');
  }
}

/* =========================
   SEED PIPELINE
========================= */

async function seed() {
  await pgClient.connect();
  await mongoose.connect(process.env.MONGODB_URI as string);

  const users = await fetchUsers();
  const substacks = await fetchSubstacks();

  if (!users.length) throw new Error('No users');
  if (!substacks.length) throw new Error('No substacks');

  await ensureIndex();

  const currentCount = await TopicModel.countDocuments();
  if (currentCount >= TOTAL_TOPICS) {
    console.log(
      `Already have ${currentCount} topics (>= ${TOTAL_TOPICS}). Skipping seed.`,
    );
    return;
  }

  const topicsToGenerate = TOTAL_TOPICS - currentCount;
  console.log(
    `Currently have ${currentCount} topics. Generating ${topicsToGenerate} more...`,
  );

  let topicsBatch: Topic[] = [];
  let commentsBatch: Comment[] = [];

  for (let i = 0; i < topicsToGenerate; i++) {
    const title = generateTitle();
    const isPublic = Math.random() < PUBLIC_TOPIC_RATIO;
    const topicId = new Types.ObjectId();

    topicsBatch.push({
      _id: topicId,
      title,
      body: generateBody(),
      slug: generateSlug(title),
      is_solved: false,
      user_id: randomItem(users),
      substack_id: isPublic ? undefined : randomItem(substacks),
      created_at: new Date(),
      updated_at: new Date(),
    });

    const numComments = faker.number.int({ min: 3, max: 10 });
    let hasAccepted = false;
    for (let j = 0; j < numComments; j++) {
      const isAccepted = !hasAccepted && Math.random() < 0.1;
      if (isAccepted) hasAccepted = true;

      commentsBatch.push({
        topic_id: topicId.toHexString(),
        user_id: randomItem(users),
        content: generateCommentBody(),
        is_accepted: isAccepted,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (topicsBatch.length >= BATCH_SIZE) {
      const insertedTopics = await TopicModel.insertMany(topicsBatch, {
        ordered: false,
      });
      await CommentModel.insertMany(commentsBatch, { ordered: false });
      await bulkIndex(insertedTopics as TOpicDoc[]);

      topicsBatch = [];
      commentsBatch = [];
      console.log(`inserted ${i + 1} topics and their comments`);

      // Periodically clear the slug set to prevent OOM
      if (slugSet.size > 50000) {
        slugSet.clear();
      }
    }
  }

  if (topicsBatch.length > 0) {
    const insertedTopics = await TopicModel.insertMany(topicsBatch, {
      ordered: false,
    });
    await CommentModel.insertMany(commentsBatch, { ordered: false });
    await bulkIndex(insertedTopics as TOpicDoc[]);
  }

  console.log('seed completed');
}

/* =========================
   EXIT
========================= */

seed()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pgClient.end();
    await mongoose.disconnect();
  });
