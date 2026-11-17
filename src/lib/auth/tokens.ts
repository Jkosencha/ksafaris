// Session tokens: 32 random bytes in the cookie, only their SHA-256 hash in the database.
import { createHash, randomBytes } from 'node:crypto';

export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
