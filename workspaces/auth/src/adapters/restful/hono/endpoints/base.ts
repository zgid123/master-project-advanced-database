import { Hono } from 'hono';

export const baseEndpoints = new Hono().get('/health', (c) => {
  return c.json({
    message: 'Ok!',
    version: '0.0.1',
  });
});
