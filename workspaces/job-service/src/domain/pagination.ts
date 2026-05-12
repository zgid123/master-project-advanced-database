import { z } from 'zod';
import { HttpError } from './errors.js';
import { parseObjectId } from './object-id.js';

const cursorSchema = z.object({
  t: z.string().datetime(),
  i: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export type KeysetCursor = {
  createdAt: Date;
  _id: ReturnType<typeof parseObjectId>;
};

export function encodeCursor(doc: { createdAt: Date | string; _id: { toHexString(): string } }): string {
  const createdAt = doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt;
  return Buffer.from(JSON.stringify({ t: createdAt, i: doc._id.toHexString() })).toString('base64url');
}

export function decodeCursor(cursor: string | undefined): KeysetCursor | null {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = cursorSchema.parse(JSON.parse(decoded));
    return {
      createdAt: new Date(parsed.t),
      _id: parseObjectId(parsed.i, 'INVALID_CURSOR'),
    };
  } catch {
    throw new HttpError(400, 'INVALID_CURSOR', 'Cursor is not valid');
  }
}
