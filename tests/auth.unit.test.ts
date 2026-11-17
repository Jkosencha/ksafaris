// Sign-in building blocks that need no database.
import { describe, expect, it } from 'vitest';
import { generateToken, hashToken } from '../src/lib/auth/tokens';
import { hashPassword, verifyDecoy, verifyPassword } from '../src/lib/auth/password';
import { MAX_PER_EMAIL, MAX_PER_EMAIL_AND_IP, MAX_PER_IP, isLimited } from '../src/lib/auth/rate-limit';
import { sessionCookieOptions } from '../src/lib/auth/session';

describe('session tokens', () => {
  it('are 32 random bytes, url-safe, and never repeat', () => {
    const tokens = new Set(Array.from({ length: 200 }, generateToken));
    expect(tokens.size).toBe(200);
    for (const t of tokens) expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes in base64url
  });

  it('are stored as a SHA-256 hash, never as themselves', () => {
    const token = generateToken();
    const hashed = hashToken(token);
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
    expect(hashed).not.toContain(token);
    expect(hashToken(token)).toBe(hashed); // same token, same hash
    expect(hashToken(generateToken())).not.toBe(hashed);
  });
});

describe('passwords', () => {
  it('are hashed with argon2id and verify only the right password', async () => {
    const h = await hashPassword('correct horse battery');
    expect(h.startsWith('$argon2id$')).toBe(true);
    expect(h).not.toContain('correct horse battery');
    expect(await verifyPassword(h, 'correct horse battery')).toBe(true);
    expect(await verifyPassword(h, 'Correct horse battery')).toBe(false);
  });

  it('treat a damaged hash as a wrong password instead of crashing', async () => {
    expect(await verifyPassword('not-a-hash', 'anything')).toBe(false);
  });

  it('check a decoy for unknown emails, which always fails', async () => {
    expect(await verifyDecoy('whatever')).toBe(false);
  });
});

describe('login rate limit', () => {
  const none = { forEmailAndIp: 0, forEmail: 0, forIp: 0 };
  it('allows attempts under every limit', () => {
    expect(isLimited(none)).toBe(false);
    expect(isLimited({ forEmailAndIp: MAX_PER_EMAIL_AND_IP - 1, forEmail: MAX_PER_EMAIL - 1, forIp: MAX_PER_IP - 1 })).toBe(false);
  });
  it('blocks after 5 failures for one email from one address', () => {
    expect(isLimited({ ...none, forEmailAndIp: 5 })).toBe(true);
  });
  it('blocks after 10 failures for one email from anywhere', () => {
    expect(isLimited({ ...none, forEmail: 10 })).toBe(true);
  });
  it('blocks after 20 failures from one address across emails', () => {
    expect(isLimited({ ...none, forIp: 20 })).toBe(true);
  });
});

describe('session cookie', () => {
  const expires = new Date('2026-12-01T00:00:00Z');
  it('is httpOnly, sameSite=lax and site-wide', () => {
    const o = sessionCookieOptions(expires, true);
    expect(o).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', secure: true, expires });
  });
  it('is only marked secure outside local development', () => {
    expect(sessionCookieOptions(expires, false).secure).toBe(false);
  });
});
