import { getDb } from './db';

const KEY_ID = 'leanpdf-enc-key';

let _cachedKey: CryptoKey | null = null;

export async function getStorageKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;

  const database = await getDb();
  const stored = await database.get('keys', KEY_ID);
  if (stored) {
    _cachedKey = stored.key;
    return _cachedKey;
  }

  // Generate a non-extractable key so the raw key material is never accessible
  // to JavaScript — it can only be used for encrypt/decrypt via the Web Crypto API.
  _cachedKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
  await database.put('keys', { id: KEY_ID, key: _cachedKey });
  return _cachedKey;
}

export async function encryptBytes(key: CryptoKey, plaintext: Uint8Array): Promise<{ iv: Uint8Array<ArrayBuffer>; ciphertext: Uint8Array<ArrayBuffer> }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = new Uint8Array(plaintext.byteLength);
  buf.set(plaintext);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buf)
  );
  return { iv, ciphertext };
}

export async function decryptBytes(key: CryptoKey, iv: Uint8Array<ArrayBuffer>, ciphertext: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  );
}
