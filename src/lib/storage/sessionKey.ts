const STORAGE_KEY = 'leanpdf-enc-key';

let _cachedKey: CryptoKey | null = null;

export async function getStorageKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    _cachedKey = await crypto.subtle.importKey(
      'jwk', JSON.parse(stored) as JsonWebKey,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
    return _cachedKey;
  }

  _cachedKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
  );
  const jwk = await crypto.subtle.exportKey('jwk', _cachedKey);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jwk));
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
