import { delKeys, getJson, setJson } from '../../cache/cache.js';
import { withTransaction } from '../../db/pool.js';
import type { PreferenceRow, PreferenceUpsertInput } from './preference.types.js';
import { PreferenceRepo } from './preference.repo.js';

function cacheKey(userId: string): string {
  return `notif:prefs:${userId}`;
}

export const PreferenceService = {
  async list(userId: string): Promise<PreferenceRow[]> {
    const cached = await getJson<PreferenceRow[]>(cacheKey(userId));
    if (cached) return cached;

    const rows = await PreferenceRepo.listForUser(userId);
    await setJson(cacheKey(userId), rows, 300);
    return rows;
  },

  async put(userId: string, preferences: PreferenceUpsertInput[]): Promise<PreferenceRow[]> {
    const rows = await withTransaction((client) => PreferenceRepo.upsertMany(userId, preferences, client));
    await delKeys(cacheKey(userId));
    return rows;
  },
};
