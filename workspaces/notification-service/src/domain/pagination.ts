import { z } from 'zod';
import { HttpError } from './errors.js';

const cursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().regex(/^\d+$/),
});

export type KeysetCursor = z.infer<typeof cursorSchema>;

export function encodeCursor(row: { created_at: Date | string; id: string }): string {
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;
  return Buffer.from(JSON.stringify({ createdAt, id: row.id })).toString('base64url');
}

export function decodeCursor(cursor: string | undefined): KeysetCursor | null {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    return cursorSchema.parse(JSON.parse(decoded));
  } catch {
    throw new HttpError(400, 'INVALID_CURSOR', 'Cursor is not valid');
  }
}

export function pageResponse<T extends { created_at: Date | string; id: string }>(
  rows: T[],
  limit: number,
) {
  return {
    items: rows,
    next_cursor: rows.length === limit ? encodeCursor(rows[rows.length - 1] as T) : null,
  };
}
