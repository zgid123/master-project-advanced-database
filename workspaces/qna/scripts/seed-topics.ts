import 'dotenv/config';

import mongoose, { Schema, model, HydratedDocument, Types } from 'mongoose';
import { Client as PgClient } from 'pg';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { faker } from '@faker-js/faker';
import slugify from 'slugify';

const TOTAL_TOPICS = 2000;
const BATCH_SIZE = 1000;
const PUBLIC_TOPIC_RATIO = 0.85;

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || 'topics';

interface Topic {
    title: string;
    body: string;
    slug: string;
    is_solved: boolean;
    user_id: string;
    substack_id?: string;
    created_at: Date;
    updated_at: Date;
}

type TopicDoc = HydratedDocument<Topic> & { _id: Types.ObjectId };

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

const randomItem = <T>(arr: T[]) =>
    arr[Math.floor(Math.random() * arr.length)];

const chunk = <T>(arr: T[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size),
    );

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

const actions = [
    'optimize',
    'debug',
    'scale',
    'design',
    'improve',
    'refactor',
    'handle',
];

const systems = [
    'MongoDB',
    'PostgreSQL',
    'Redis',
    'Kafka',
    'NestJS',
    'Elasticsearch',
    'RabbitMQ',
];

const contexts = [
    'high traffic system',
    'microservices architecture',
    'distributed system',
    'real-time application',
    'production environment',
];

function generateTitle() {
    const action = randomItem(actions);
    const system = randomItem(systems);
    const context = randomItem(contexts);

    return `How to ${action} ${system} in ${context}?`;
}

function generateBody() {
    return `
        I'm building a system using ${randomItem(systems)} in a ${randomItem(contexts)}.

        We are facing performance issues under load.

        What we tried:
        - caching strategy
        - indexing
        - async processing
        - horizontal scaling

        Still seeing instability in production.

        Looking for best practices around architecture and scaling.
    `;
}

/* =========================
   ELASTICSEARCH
========================= */

async function ensureIndex() {
    try {
        await elastic.indices.delete({ index: ELASTICSEARCH_INDEX });
    } catch (_) { }

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

async function bulkIndex(docs: TopicDoc[]) {
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
   GENERATION
========================= */

async function generate(
    users: string[],
    substacks: string[],
): Promise<Topic[]> {
    const topics: Topic[] = [];

    for (let i = 0; i < TOTAL_TOPICS; i++) {
        const title = generateTitle();

        const isPublic = Math.random() < PUBLIC_TOPIC_RATIO;

        topics.push({
            title,
            body: generateBody(),
            slug: generateSlug(title),
            is_solved: false,
            user_id: randomItem(users),
            substack_id: isPublic ? undefined : randomItem(substacks),
            created_at: new Date(),
            updated_at: new Date(),
        });

        if (i % 1000 === 0) {
            console.log(`generated ${i}`);
        }
    }

    return topics;
}

/* =========================
   SEED PIPELINE
========================= */

async function seed() {
    await pgClient.connect();
    await mongoose.connect("mongodb+srv://admin:hungtruong123@cluster0.htw9pph.mongodb.net/?appName=Cluster0");

    const users = await fetchUsers();
    const substacks = await fetchSubstacks();

    if (!users.length) throw new Error('No users');
    if (!substacks.length) throw new Error('No substacks');

    await ensureIndex();

    await TopicModel.deleteMany({});

    const data = await generate(users, substacks);

    const batches = chunk(data, BATCH_SIZE);

    for (const batch of batches) {
        const inserted = await TopicModel.insertMany(batch as any, {
            ordered: false,
        });

        await bulkIndex(inserted as TopicDoc[]);
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