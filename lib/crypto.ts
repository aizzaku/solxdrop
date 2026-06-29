/**
 * Client-side encryption for the X Bearer Token.
 *
 * The AES-GCM key is generated as non-extractable and stored in IndexedDB, so
 * its raw bytes never leave the browser's crypto subsystem. Only the resulting
 * ciphertext + IV live in localStorage. No user password is required.
 */

const DB_NAME = "ansem-airdrop";
const STORE = "keys";
const KEY_ID = "x-token-key";
const TOKEN_STORAGE_KEY = "ansem:x-token-cipher";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(key: string): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
      })
  );
}

function idbSet(key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const existing = await idbGet<CryptoKey>(KEY_ID);
  if (existing) return existing;
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false, // non-extractable
    ["encrypt", "decrypt"]
  );
  await idbSet(KEY_ID, key);
  return key;
}

function toB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function saveToken(token: string): Promise<void> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(token)
  );
  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    JSON.stringify({ iv: toB64(iv.buffer), data: toB64(ciphertext) })
  );
}

export async function loadToken(): Promise<string | null> {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  const key = await idbGet<CryptoKey>(KEY_ID);
  if (!key) return null;
  try {
    const { iv, data } = JSON.parse(raw) as { iv: string; data: string };
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(iv) },
      key,
      fromB64(data)
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export function hasToken(): boolean {
  return typeof localStorage !== "undefined" && !!localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
