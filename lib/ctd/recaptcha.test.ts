import { afterEach, describe, expect, it, vi } from "vitest";

import { RECAPTCHA_ACTION } from "./fields";
import { getRecaptchaSiteKey, verifyRecaptcha } from "./recaptcha";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("verifyRecaptcha", () => {
  it("skips verification in development when no secret is configured", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    vi.stubEnv("NODE_ENV", "development");

    await expect(verifyRecaptcha("")).resolves.toEqual({ ok: true });
  });

  it("fails closed in production when no secret is configured", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    vi.stubEnv("NODE_ENV", "production");

    await expect(verifyRecaptcha("token")).resolves.toEqual({
      ok: false,
      error: "Spam protection is not configured. Please contact us directly.",
    });
  });

  it("rejects a missing token when a secret is configured", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret";

    await expect(verifyRecaptcha("")).resolves.toEqual({
      ok: false,
      error:
        "Please refresh the page and try again so we can verify your submission.",
    });
  });

  it("posts the token to Google and checks the existing action name", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.9,
        action: RECAPTCHA_ACTION,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyRecaptcha("token-123", "1.1.1.1")).resolves.toEqual({
      ok: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.google.com/recaptcha/api/siteverify",
      expect.objectContaining({ method: "POST" }),
    );

    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("secret")).toBe("secret");
    expect(body.get("response")).toBe("token-123");
    expect(body.get("remoteip")).toBe("1.1.1.1");
  });

  it("rejects a successful token issued for a different action", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.9,
          action: "some_other_action",
        }),
      }),
    );

    await expect(verifyRecaptcha("token-123")).resolves.toEqual({
      ok: false,
      error: "Security verification did not match this form. Please try again.",
    });
  });
});

describe("getRecaptchaSiteKey", () => {
  it("reads the existing environment variable and does not invent a key", () => {
    delete process.env.RECAPTCHA_SITE_KEY;
    expect(getRecaptchaSiteKey()).toBe("");

    process.env.RECAPTCHA_SITE_KEY = "site-key";
    expect(getRecaptchaSiteKey()).toBe("site-key");
  });
});
