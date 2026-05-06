import { sql } from 'drizzle-orm';
import { bigint, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestampSchema = {
  createdAt: timestamp({
    mode: 'date',
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({
    mode: 'date',
  })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const baseSchema = {
  id: bigint({
    mode: 'bigint',
  })
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  ...timestampSchema,
};

export const baseUuidSchema = {
  id: uuid('id').primaryKey().default(sql`uuidv7()`),
  ...timestampSchema,
};
