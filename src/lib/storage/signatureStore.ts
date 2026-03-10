import { getDb } from './db';
import type { StoredSignatureAsset } from '../pdf/types';

export async function listSignatures() {
  const database = await getDb();
  const signatures = await database.getAll('signatures');
  return signatures.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function saveSignature(signature: StoredSignatureAsset) {
  const database = await getDb();
  await database.put('signatures', signature);
}

export async function removeSignature(signatureId: string) {
  const database = await getDb();
  await database.delete('signatures', signatureId);
}
