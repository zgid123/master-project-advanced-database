import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { Server, type Socket } from 'socket.io';
import { config } from '../config.js';
import { logger } from '../observability/logger.js';

type JwtPayload = {
  sub?: unknown;
  [key: string]: unknown;
};

function verifyHs256Token(token: string): JwtPayload {
  if (config.jwtPublicKey || config.jwtJwksUrl) {
    throw new Error('Realtime gateway currently supports JWT_SECRET HS256 verification');
  }

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
  const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as { alg?: string };
  if (header.alg !== 'HS256') throw new Error('Unsupported JWT alg');

  const expected = createHmac('sha256', config.jwtSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const actual = Buffer.from(encodedSignature, 'base64url');

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('Invalid JWT signature');
  }

  return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as JwtPayload;
}

async function authenticateSocket(socket: Socket, next: (error?: Error) => void): Promise<void> {
  try {
    const token = typeof socket.handshake.auth.token === 'string'
      ? socket.handshake.auth.token
      : String(socket.handshake.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    const payload = verifyHs256Token(token);
    const userId = String(payload.sub ?? '');

    if (!/^\d+$/.test(userId)) throw new Error('JWT subject must be a numeric user id');

    socket.data.userId = userId;
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Socket authentication failed'));
  }
}

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const pub = new Redis(config.redisUrl);
const sub = pub.duplicate();
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

process.on('SIGTERM', async () => {
  io.close();
  httpServer.close();
  await Promise.all([pub.quit(), sub.quit()]);
});
