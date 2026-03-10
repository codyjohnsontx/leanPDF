import { getDb } from './db';
import type { DraftStore, RecentDocumentRecord } from '../pdf/types';

export const sessionStore: DraftStore = {
  async save(_sessionId, data) {
    const database = await getDb();
    await database.put('drafts', data);
    await database.put('recents', {
      id: data.id,
      name: data.name,
      lastOpenedAt: data.lastOpenedAt,
      pageCount: data.pageCount,
    });
  },

  async load(sessionId) {
    const database = await getDb();
    return (await database.get('drafts', sessionId)) ?? null;
  },

  async remove(sessionId) {
    const database = await getDb();
    await database.delete('drafts', sessionId);
    await database.delete('recents', sessionId);
  },
};

export async function listRecentDocuments(): Promise<RecentDocumentRecord[]> {
  const database = await getDb();
  const records = await database.getAll('recents');
  return records.sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt));
}
