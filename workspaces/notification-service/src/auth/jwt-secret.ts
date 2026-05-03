import { createPublicKey } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { config } from '../config.js';
import { logger } from '../observability/logger.js';

type JwtHeaderLike = {
  kid?: string;
  alg?: string;
};

type TokenOrHeaderLike = JwtHeaderLike | {
  header?: JwtHeaderLike;
  payload?: unknown;
};

type JwtPayloadClaims = {
  aud?: unknown;
  exp?: unknown;
  iss?: unknown;
  nbf?: unknown;
};

type JwksKey = Record<string, unknown> & {
  kid?: string;
  kty?: string;
  use?: string;
  alg?: string;
};

type JwksResponse = {
  keys?: JwksKey[];
};

const jwksCache = new Map<string, string>();
const jwksNegativeCache = new Map<string, number>();
let jwksCacheExpiresAt = 0;
let refreshPromise: Promise<void> | null = null;

function normalizePublicKey(value: string): string {
  return value.replace(/\\n/g, '\n');
}

function getHeader(tokenOrHeader: TokenOrHeaderLike): JwtHeaderLike {
  if ('header' in tokenOrHeader && tokenOrHeader.header) return tokenOrHeader.header;
  return tokenOrHeader as JwtHeaderLike;
}

function jwkToPem(jwk: JwksKey): string {
  return createPublicKey({
    key: jwk,
    format: 'jwk',
  }).export({
    format: 'pem',
    type: 'spki',
  }).toString();
}

async function refreshJwks(): Promise<void> {
  if (!config.jwtJwksUrl) return;

  const response = await fetch(config.jwtJwksUrl);
  if (!response.ok) throw new Error(`JWKS fetch failed with HTTP ${response.status}`);

  const body = (await response.json()) as JwksResponse;
  const nextCache = new Map<string, string>();

  for (const key of body.keys ?? []) {
    if (!key.kid || key.kty !== 'RSA') continue;
    if (key.use && key.use !== 'sig') continue;
    if (key.alg && key.alg !== 'RS256') continue;
    nextCache.set(key.kid, jwkToPem(key));
  }

  jwksCache.clear();
  for (const [kid, pem] of nextCache.entries()) {
    jwksCache.set(kid, pem);
    jwksNegativeCache.delete(kid);
  }
  jwksCacheExpiresAt = Date.now() + config.jwtJwksCacheTtlMs;
}

async function ensureFreshJwks(): Promise<void> {
  if (!config.jwtJwksUrl || Date.now() < jwksCacheExpiresAt) return;

  refreshPromise ??= refreshJwks().finally(() => {
    refreshPromise = null;
  });

  await refreshPromise;
}

export function jwtAlgorithms(): ['RS256'] | ['HS256'] {
  return config.jwtJwksUrl || config.jwtPublicKey ? ['RS256'] : ['HS256'];
}

export async function resolveJwtSecret(
  _request: FastifyRequest | undefined,
  tokenOrHeader: TokenOrHeaderLike,
): Promise<string | Buffer> {
  if (config.jwtPublicKey) return normalizePublicKey(config.jwtPublicKey);
  if (!config.jwtJwksUrl) return config.jwtSecret;

  const header = getHeader(tokenOrHeader);
  if (!header.kid) throw new Error('JWT kid header is required for JWKS verification');

  const negativeCacheExpiresAt = jwksNegativeCache.get(header.kid) ?? 0;
  if (negativeCacheExpiresAt > Date.now()) {
    throw new Error('JWT public key not found for kid');
  }

  await ensureFreshJwks();
  let publicKey = jwksCache.get(header.kid);

  if (!publicKey) {
    logger.warn({ kid: header.kid }, 'JWT kid not found in JWKS cache; refreshing');
    await refreshJwks();
    publicKey = jwksCache.get(header.kid);
  }

  if (!publicKey) {
    jwksNegativeCache.set(header.kid, Date.now() + config.jwtJwksNegativeCacheTtlMs);
    throw new Error('JWT public key not found for kid');
  }

  return publicKey;
}

export function jwtVerifyOptions() {
  return {
    algorithms: jwtAlgorithms(),
    ...(config.jwtIssuer ? { allowedIss: config.jwtIssuer } : {}),
    ...(config.jwtAudiences.length > 0 ? { allowedAud: config.jwtAudiences } : {}),
  };
}

export function assertJwtPayloadClaims(payload: JwtPayloadClaims): void {
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp <= now) throw new Error('JWT is expired');
  if (typeof payload.nbf === 'number' && payload.nbf > now) throw new Error('JWT is not active yet');

  if (config.jwtIssuer && payload.iss !== config.jwtIssuer) {
    throw new Error('JWT issuer is invalid');
  }

  if (config.jwtAudiences.length === 0) return;

  const audiences = Array.isArray(payload.aud)
    ? payload.aud.filter((audience): audience is string => typeof audience === 'string')
    : typeof payload.aud === 'string'
      ? [payload.aud]
      : [];

  if (!audiences.some((audience) => config.jwtAudiences.includes(audience))) {
    throw new Error('JWT audience is invalid');
  }
}
