import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
function key() {
  const text = process.env.DATA_ENCRYPTION_KEY;
  if (!text) {if(process.env.NODE_ENV==='production')throw new Error('Production requires DATA_ENCRYPTION_KEY');return null;}
  const bytes = Buffer.from(text, 'base64');
  if (bytes.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must be a 32-byte base64 key');
  return bytes;
}
export function protect(value: string) {
  const k = key();
  if (!k) return value; // demo default; production deployment must configure key
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', k, iv);
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['enc1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), body.toString('base64')].join(':');
}
export function reveal(value: string | null | undefined) {
  if (!value) return '';
  if (!value.startsWith('enc1:')) {if(process.env.NODE_ENV==='production'&&!['[]','{}'].includes(value))throw new Error('Plaintext record requires encryption migration');return value;}
  const k = key();
  if (!k) throw new Error('Encrypted record requires DATA_ENCRYPTION_KEY');
  const [, a, b, c] = value.split(':');
  const decipher = createDecipheriv('aes-256-gcm', k, Buffer.from(a, 'base64'));
  decipher.setAuthTag(Buffer.from(b, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(c, 'base64')), decipher.final()]).toString('utf8');
}
export function safeJson<T>(value: string | null | undefined, fallback: T): T {
  try { return value ? JSON.parse(reveal(value)) as T : fallback; } catch { return fallback; }
}
