import { getDb } from './db';
import type { StoredDraftRecord } from './db';
import { getStorageKey, encryptBytes, decryptBytes } from './sessionKey';
import type { DraftSessionRecord, DraftStore, RecentDocumentRecord } from '../pdf/types';

function toStoredDraftRecord(
  data: DraftSessionRecord,
  encryptedBytes: Uint8Array<ArrayBuffer>,
  iv: Uint8Array<ArrayBuffer>,
): StoredDraftRecord {
  const rest = { ...data } as Partial<DraftSessionRecord>;
  delete rest.bytes;
  return { ...(rest as Omit<DraftSessionRecord, 'bytes'>), encryptedBytes, iv };
}

function toDraftSessionRecord(stored: StoredDraftRecord, bytes: Uint8Array): DraftSessionRecord {
  const rest = { ...stored } as Partial<StoredDraftRecord>;
  delete rest.encryptedBytes;
  delete rest.iv;
  return { ...(rest as Omit<StoredDraftRecord, 'encryptedBytes' | 'iv'>), bytes };
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

    const key = await getStorageKey();
    try {
      const bytes = await decryptBytes(key, stored.iv, stored.encryptedBytes);
      return toDraftSessionRecord(stored, bytes);
    } catch {
      // Decrypt or deserialize failure — delete both stores so the recent
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
