// biome-ignore-all lint/style/useNamingConvention: feed cursor alias keeps the API vocabulary.
import { z } from 'zod';

import { HttpError } from '../errors.js';

const cursorSchema = z.object({
  score: z.number(),
  id: z.string().min(1),
});

export type FeedCursor = z.infer<typeof cursorSchema>;

export function encodeCursor(row: { score: number; id: string }): string {
  return Buffer.from(JSON.stringify(row)).toString('base64url');
}

export function decodeCursor(cursor: string | undefined): FeedCursor | null {
  if (!cursor) return null;

  try {
    return cursorSchema.parse(
      JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')),
    );
  } catch {
    throw new HttpError(400, 'INVALID_CURSOR', 'Cursor is not valid');
  }
}

export function isAfterCursor(
  candidate: { score: number; topicId: string },
  cursor: FeedCursor | null,
): boolean {
  if (!cursor) return true;
  if (candidate.score < cursor.score) return true;
  return candidate.score === cursor.score && candidate.topicId > cursor.id;
}
