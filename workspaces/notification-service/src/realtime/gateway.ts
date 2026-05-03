import { createHmac, createVerify, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { Server, type Socket } from 'socket.io';
import { assertJwtPayloadClaims, jwtAlgorithms, resolveJwtSecret } from '../auth/jwt-secret.js';
import { config } from '../config.js';
import { logger } from '../observability/logger.js';

type JwtPayload = {
  aud?: unknown;
  exp?: unknown;
  iss?: unknown;
  nbf?: unknown;
  sub?: unknown;
  [key: string]: unknown;
};

function decodeJsonPart<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

async function verifyJwtToken(token: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
  const header = decodeJsonPart<{ alg?: string; kid?: string }>(encodedHeader);
  const payload = decodeJsonPart<JwtPayload>(encodedPayload);
  const algorithms = jwtAlgorithms();
  if (!algorithms.includes(header.alg as never)) throw new Error('Unsupported JWT alg');

  const signedPart = `${encodedHeader}.${encodedPayload}`;
  const actual = Buffer.from(encodedSignature, 'base64url');
  const secret = await resolveJwtSecret(undefined, { header, payload });

  if (header.alg === 'HS256') {
    const expected = createHmac('sha256', secret)
      .update(signedPart)
      .digest();

    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new Error('Invalid JWT signature');
    }
  } else if (header.alg === 'RS256') {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(signedPart);
    verifier.end();
    if (!verifier.verify(secret, actual)) throw new Error('Invalid JWT signature');
  } else {
    throw new Error('Unsupported JWT alg');
  }

  assertJwtPayloadClaims(payload);
  return payload;
}

async function authenticateSocket(socket: Socket, next: (error?: Error) => void): Promise<void> {
  try {
    const token = typeof socket.handshake.auth.token === 'string'
      ? socket.handshake.auth.token
      : String(socket.handshake.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    const payload = await verifyJwtToken(token);
    const userId = String(payload.sub ?? '');

    if (!/^\d+$/.test(userId)) throw new Error('JWT subject must be a numeric user id');

    socket.data.userId = userId;
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Socket authentication failed'));
  }
}

async function startGateway(): Promise<void> {
  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  const pub = new Redis(config.redisUrl, { lazyConnect: true });
  const sub = pub.duplicate();
  await Promise.all([pub.connect(), sub.connect()]);

  io.adapter(createAdapter(pub, sub));
  io.use((socket, next) => {
    authenticateSocket(socket, next).catch(next);
  });

  io.on('connection', (socket) => {
    const userId = String(socket.data.userId);
    socket.join(`user:${userId}`);
    socket.emit('hello', { user_id: userId });
    logger.info({ socketId: socket.id, userId }, 'realtime socket connected');
  });

  httpServer.listen(config.realtimePort, config.host, () => {
    logger.info({ port: config.realtimePort, host: config.host }, 'notification realtime gateway started');
  });

  const shutdown = async () => {
    io.close();
    httpServer.close();
    await Promise.all([pub.quit(), sub.quit()]);
  };

  process.on('SIGTERM', () => {
    shutdown().catch((error: unknown) => logger.error({ error }, 'realtime shutdown failed'));
  });
  process.on('SIGINT', () => {
    shutdown().catch((error: unknown) => logger.error({ error }, 'realtime shutdown failed'));
  });
}

await startGateway();
