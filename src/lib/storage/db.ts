import { openDB } from 'idb';
import type { DraftSessionRecord, RecentDocumentRecord, StoredSignatureAsset } from '../pdf/types';

export type StoredDraftRecord = Omit<DraftSessionRecord, 'bytes'> & {
  encryptedBytes: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
};

type OpenPdfDb = {
  drafts: {
    key: string;
    value: StoredDraftRecord;
  };
  recents: {
    key: string;
    value: RecentDocumentRecord;
  };
  signatures: {
    key: string;
    value: StoredSignatureAsset;
  };
  keys: {
    key: string;
    value: { id: string; key: CryptoKey };
  };
};

export function getDb() {
  return openDB<OpenPdfDb>('leanpdf-db', 3, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        database.createObjectStore('recents', { keyPath: 'id' });
        database.createObjectStore('signatures', { keyPath: 'id' });
      }
      if (oldVersion < 2) {
        // Drop old unencrypted drafts store; recreate clean
        if (database.objectStoreNames.contains('drafts')) {
          database.deleteObjectStore('drafts');
        }
        database.createObjectStore('drafts', { keyPath: 'id' });
      }
      if (oldVersion < 3) {
        database.createObjectStore('keys', { keyPath: 'id' });
      }
    },
  });
}
