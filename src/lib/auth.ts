import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createHash, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'palic_admin';

const rawSecret = process.env.AUTH_SECRET;
if (process.env.NODE_ENV === 'production' && (!rawSecret || rawSecret.length < 16)) {
  throw new Error(
    'AUTH_SECRET must be set to a strong value (>= 16 chars) in production.'
  );
}
const secret = new TextEncoder().encode(rawSecret || 'dev-secret-change-me');

const sha256 = (v: string) => createHash('sha256').update(v).digest();

/**
 * Constant-time comparison against ADMIN_PASSWORD (hashing both sides first so
 * lengths always match and comparison time doesn't leak password length).
 */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (expected.length === 0) return false;
  return timingSafeEqual(sha256(input), sha256(expected));
}

export async function createSession(): Promise<void> {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
