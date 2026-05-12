import { ObjectId } from 'mongodb';
import { HttpError } from './errors.js';

const objectIdHexPattern = /^[0-9a-fA-F]{24}$/;

export function isObjectIdHex(value: string): boolean {
  return objectIdHexPattern.test(value);
}

export function objectIdOrNull(value: string): ObjectId | null {
  if (!isObjectIdHex(value)) return null;
  return new ObjectId(value);
}

export function parseObjectId(value: string, code = 'INVALID_OBJECT_ID'): ObjectId {
  const objectId = objectIdOrNull(value);
  if (!objectId) {
    throw new HttpError(400, code, 'Value must be a 24-character ObjectId hex string');
  }

  return objectId;
}
