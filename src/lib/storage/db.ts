import { openDB } from 'idb';
import type { DraftSessionRecord, RecentDocumentRecord, StoredSignatureAsset } from '../pdf/types';

type OpenPdfDb = {
  drafts: {
    key: string;
    value: DraftSessionRecord;
  };
  recents: {
    key: string;
    value: RecentDocumentRecord;
  };
  signatures: {
    key: string;
    value: StoredSignatureAsset;
  };
};

export function getDb() {
  return openDB<OpenPdfDb>('leanpdf-db', 1, {
    upgrade(database) {
      database.createObjectStore('drafts', { keyPath: 'id' });
      database.createObjectStore('recents', { keyPath: 'id' });
      database.createObjectStore('signatures', { keyPath: 'id' });
    },
  });
}
