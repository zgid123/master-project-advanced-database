import { Hono } from 'hono';

import { baseEndpoints } from './base';

export const endpoints = new Hono().route('/', baseEndpoints);
