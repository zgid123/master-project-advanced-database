import { addDays, addHours, addYears } from '@alphacifer/core-utils/dateUtils';
import type { Context } from 'hono';
import { setCookie } from 'hono/cookie';

interface ISetHttpOnlyOptions {
  secure?: boolean;
  expires?: `${number}d` | `${number}h` | `${number}y`;
}

const expiresFuncMapping = {
  d: addDays,
  h: addHours,
  y: addYears,
} as const;

export function setHttpOnly(
  c: Context,
  name: string,
  value: string,
  { secure = true, expires = '1h' }: ISetHttpOnlyOptions = {},
): void {
  const func =
    expiresFuncMapping[expires.slice(-1) as keyof typeof expiresFuncMapping];

  setCookie(c, name, value, {
    secure,
    httpOnly: true,
    expires: func(new Date(), Number(expires.slice(0, -1))),
  });
}
