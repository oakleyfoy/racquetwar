import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hashToken,
  signDirectorCookie,
  verifyDirectorCookie,
} from "./director-session";

describe("director session tokens", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("signs and verifies a hashed session cookie", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-director-secret");
    const expiresAt = Date.now() + 60_000;
    const cookie = await signDirectorCookie("session-1", expiresAt);
    await expect(verifyDirectorCookie(cookie)).resolves.toEqual({
      sessionId: "session-1",
      expiresAt,
    });
    await expect(verifyDirectorCookie("forged.1.sig")).resolves.toBeNull();
  });

  it("hashes login tokens so the raw value is not stored", async () => {
    const raw = "abc123";
    const hashed = await hashToken(raw);
    expect(hashed).not.toBe(raw);
    expect(hashed).toHaveLength(64);
    expect(hashed).toBe(await hashToken(raw));
  });
});
