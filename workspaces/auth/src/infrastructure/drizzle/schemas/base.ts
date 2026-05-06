import { sql } from '@alphacifer/drizzle/core';
import { timestamp, uuid } from '@alphacifer/drizzle/pg';

export const timestampSchema = {
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
    .$onUpdate(() => {
      return new Date();
    }),
};

export const baseUuidSchema = {
  id: uuid('id').primaryKey().default(sql`uuidv7()`),
  ...timestampSchema,
};
