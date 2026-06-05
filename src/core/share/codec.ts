import { gzipSync, gunzipSync, strFromU8, strToU8 } from 'fflate';
import type { SharePayloadV1 } from './payload';

const HASH_PREFIX = '#v1.';
const OBFUSCATION_KEY = 0xa7;

function obfuscate(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = bytes[i]! ^ (OBFUSCATION_KEY ^ (i % 251));
  }
  return out;
}

function deobfuscate(bytes: Uint8Array): Uint8Array {
  return obfuscate(bytes);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(pad));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function gzipCompress(text: string): Uint8Array {
  return gzipSync(strToU8(text));
}

function gzipDecompress(bytes: Uint8Array): string {
  return strFromU8(gunzipSync(bytes));
}

/** Encodes payload into an opaque hash fragment (no readable goal text). */
export function encodeShareHash(payload: SharePayloadV1): string {
  const json = JSON.stringify(payload);
  const compressed = gzipCompress(json);
  const scrambled = obfuscate(compressed);
  return `${HASH_PREFIX}${bytesToBase64Url(scrambled)}`;
}

/** Decodes hash fragment; returns null when invalid. */
export function decodeShareHash(hash: string): SharePayloadV1 | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  try {
    const encoded = hash.slice(HASH_PREFIX.length);
    const scrambled = base64UrlToBytes(encoded);
    const compressed = deobfuscate(scrambled);
    const json = gzipDecompress(compressed);
    const parsed = JSON.parse(json) as SharePayloadV1;
    if (parsed?.v !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildShareUrl(origin: string, pathname: string, hash: string): string {
  return `${origin}${pathname}${hash}`;
}
