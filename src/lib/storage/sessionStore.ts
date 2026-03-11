import { getDb } from './db';
import type { StoredDraftRecord } from './db';
import { getStorageKey, encryptBytes, decryptBytes } from './sessionKey';
import type { DraftStore, RecentDocumentRecord } from '../pdf/types';

export const sessionStore: DraftStore = {
  async save(_sessionId, data) {
    const key = await getStorageKey();
    const { iv, ciphertext } = await encryptBytes(key, data.bytes);
    const { bytes: _, ...rest } = data;
    const stored: StoredDraftRecord = { ...rest, encryptedBytes: ciphertext, iv };

    const database = await getDb();
    await database.put('drafts', stored);
    await database.put('recents', {
      id: data.id,
      name: data.name,
      lastOpenedAt: data.lastOpenedAt,
      pageCount: data.pageCount,
    });
  },

  async load(sessionId) {
    const database = await getDb();
    const stored = await database.get('drafts', sessionId);
    if (!stored) return null;

    try {
      const key = await getStorageKey();
      const bytes = await decryptBytes(key, stored.iv, stored.encryptedBytes);
      const { encryptedBytes: _, iv: __, ...rest } = stored;
      return { ...rest, bytes };
    } catch {
      // Key mismatch or corrupt record — delete and treat as no draft
      await database.delete('drafts', sessionId);
      return null;
    }
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
