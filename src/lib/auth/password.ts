// Password hashing with argon2id. Plain passwords are never stored or logged.
import { hash, verify } from '@node-rs/argon2';

// OWASP-recommended argon2id settings (19 MiB memory, 2 passes).
const OPTIONS = { algorithm: 2 /* Argon2id */, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const MIN_PASSWORD_LENGTH = 12;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false; // malformed hash: treat as a wrong password
  }
}

/**
 * A real hash of a throwaway password. Checked when the email is unknown, so a
 * wrong email takes as long as a wrong password and can't be told apart by timing.
 */
let decoy: Promise<string> | undefined;
export async function verifyDecoy(password: string): Promise<false> {
  decoy ??= hashPassword('decoy-password-never-used');
  await verifyPassword(await decoy, password);
  return false;
}
