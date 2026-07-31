/**
 * Minimal signed-cookie session for the admin area. Uses Web Crypto rather than
 * node:crypto so the same verification runs in middleware and in route handlers.
 */

export const ADMIN_COOKIE = "ctd_admin_session";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function getPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || getPassword();
}

export function isAdminConfigured() {
  return Boolean(getPassword());
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

/** Length-independent comparison to avoid leaking information through timing. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}

export async function verifyPassword(candidate: string) {
  const expected = getPassword();
  if (!expected) return false;

  // Hash both sides first so the comparison length cannot reveal the password length.
  const [candidateHash, expectedHash] = await Promise.all([
    sign(`password:${candidate}`),
    sign(`password:${expected}`),
  ]);

  return safeEqual(candidateHash, expectedHash);
}

export async function createSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const signature = await sign(String(expiresAt));
  return `${expiresAt}.${signature}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token || !getSecret()) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  return safeEqual(signature, await sign(expiresAt));
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/tournament-director",
  maxAge: SESSION_TTL_MS / 1000,
};
