/**
 * Director authentication.
 *
 * No Director portal existed. Access is per activated Director record, not a
 * shared password. Magic-link tokens and session tokens are stored only as
 * SHA-256 hashes, with expiry and revocation. The cookie is signed so the
 * edge proxy can reject forged values without a database lookup; pages and
 * actions still confirm the Director is active and the session is not revoked.
 */

import { ADMIN_COOKIE } from "./admin-session";

export const DIRECTOR_COOKIE = "ctd_director_session";
export const DIRECTOR_LOGIN_PATH = "/tournament-director/portal/login";
export const DIRECTOR_AUTH_PATH = "/tournament-director/portal/auth";
export const DIRECTOR_PORTAL_PATH = "/tournament-director/portal";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOGIN_TTL_MS = 30 * 60 * 1000;
const encoder = new TextEncoder();

function getSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    ""
  );
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function hashToken(value: string) {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

export function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

export function loginTokenTtlMs() {
  return LOGIN_TTL_MS;
}

export async function signDirectorCookie(sessionId: string, expiresAt: number) {
  const payload = `${sessionId}.${expiresAt}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifyDirectorCookie(token: string | undefined) {
  if (!token || !getSecret()) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [sessionId, expiresAt, signature] = parts;
  const expiry = Number(expiresAt);
  if (!sessionId || !Number.isFinite(expiry) || expiry < Date.now()) return null;
  if (!safeEqual(signature, await hmac(`${sessionId}.${expiresAt}`))) return null;
  return { sessionId, expiresAt: expiry };
}

export const DIRECTOR_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/tournament-director",
  maxAge: SESSION_TTL_MS / 1000,
};

export function directorSessionTtlMs() {
  return SESSION_TTL_MS;
}

export { ADMIN_COOKIE };
