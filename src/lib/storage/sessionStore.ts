import { getDb } from './db';
import type { StoredDraftRecord } from './db';
import { getStorageKey, encryptBytes, decryptBytes } from './sessionKey';
import type { DraftSessionRecord, DraftStore, RecentDocumentRecord } from '../pdf/types';

function toStoredDraftRecord(
  data: DraftSessionRecord,
  encryptedBytes: Uint8Array<ArrayBuffer>,
  iv: Uint8Array<ArrayBuffer>,
): StoredDraftRecord {
  return {
    id: data.id,
    documentId: data.documentId,
    name: data.name,
    pageCount: data.pageCount,
    currentPage: data.currentPage,
    zoom: data.zoom,
    rotation: data.rotation,
    hasUnsavedChanges: data.hasUnsavedChanges,
    annotations: data.annotations,
    formValues: data.formValues,
    selectedTool: data.selectedTool,
    selectedSignatureAssetId: data.selectedSignatureAssetId,
    protectionStatus: data.protectionStatus,
    lastOpenedAt: data.lastOpenedAt,
    encryptedBytes,
    iv,
  };
}

function toDraftSessionRecord(stored: StoredDraftRecord, bytes: Uint8Array): DraftSessionRecord {
  return {
    id: stored.id,
    documentId: stored.documentId,
    name: stored.name,
    bytes,
    pageCount: stored.pageCount,
    currentPage: stored.currentPage,
    zoom: stored.zoom,
    rotation: stored.rotation,
    hasUnsavedChanges: stored.hasUnsavedChanges,
    annotations: stored.annotations,
    formValues: stored.formValues,
    selectedTool: stored.selectedTool,
    selectedSignatureAssetId: stored.selectedSignatureAssetId,
    protectionStatus: stored.protectionStatus,
    lastOpenedAt: stored.lastOpenedAt,
  };
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
