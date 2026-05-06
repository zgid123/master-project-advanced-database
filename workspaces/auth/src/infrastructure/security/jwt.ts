import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';

export const DEFAULT_AUDIENCE = 'solvit';

interface IExtractJWTParams {
  token: string;
  secretKey?: string;
}

export function extractJWT<T = unknown>(
  { token, secretKey = '' }: IExtractJWTParams,
  options: VerifyOptions = {},
): T {
  const { audience = DEFAULT_AUDIENCE, ...restOptions } = options;

  return jwt.verify(token, secretKey || process.env.JWT_SECRET, {
    ...restOptions,
    audience,
  }) as T;
}

interface IGenTokenParams {
  jti?: string;
  secretKey?: string;
  aud?: string | string[];
  algorithm?: 'HS256' | 'HS512';
  exp?: SignOptions['expiresIn'];
  payload: Record<string, string | string[]>;
}

export async function genToken({
  exp,
  jti,
  payload,
  secretKey,
  algorithm = 'HS256',
  aud = DEFAULT_AUDIENCE,
}: IGenTokenParams): Promise<string> {
  exp ||= 60 * 60;
  jti ||= nanoid(20);

  return jwt.sign(
    {
      ...payload,
      jti,
      aud,
    },
    secretKey || process.env.JWT_SECRET,
    {
      algorithm,
      expiresIn: exp,
    },
  );
}
