import { getDb } from './db';
import type { StoredDraftRecord } from './db';
import { getStorageKey, encryptBytes, decryptBytes } from './sessionKey';
import type { DraftSessionRecord, DraftStore, RecentDocumentRecord } from '../pdf/types';

function toStoredDraftRecord(
  data: DraftSessionRecord,
  encryptedBytes: Uint8Array<ArrayBuffer>,
  iv: Uint8Array<ArrayBuffer>,
): StoredDraftRecord {
  const { bytes: _bytes, ...rest } = data;
  return { ...rest, encryptedBytes, iv };
}

function toDraftSessionRecord(stored: StoredDraftRecord, bytes: Uint8Array): DraftSessionRecord {
  const { encryptedBytes: _enc, iv: _iv, ...rest } = stored;
  return { ...rest, bytes };
}

export const sessionStore: DraftStore = {
  async save(sessionId, data) {
    const key = await getStorageKey();
    const { iv, ciphertext } = await encryptBytes(key, data.bytes);
    const stored = toStoredDraftRecord({ ...data, id: sessionId }, ciphertext, iv);

    const database = await getDb();
    await database.put('drafts', stored);
    await database.put('recents', {
      id: sessionId,
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
      return toDraftSessionRecord(stored, bytes);
    } catch {
      // Key mismatch or corrupt record — delete both stores so the recent
      // entry doesn't appear as a loadable document in listRecentDocuments()
      await database.delete('drafts', sessionId);
      await database.delete('recents', sessionId);
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
