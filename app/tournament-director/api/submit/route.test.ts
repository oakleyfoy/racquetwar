import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VALID_SUBMIT_BODY } from "@/lib/ctd/test-fixtures";

const insertApplication = vi.fn();
const dispatchApplicationEmails = vi.fn();
const verifyRecaptcha = vi.fn();
const isDatabaseConfigured = vi.fn();
const isMailConfigured = vi.fn();

vi.mock("@/lib/ctd/applications", () => ({
  insertApplication: (...args: unknown[]) => insertApplication(...args),
}));

vi.mock("@/lib/ctd/mail", () => ({
  dispatchApplicationEmails: (...args: unknown[]) =>
    dispatchApplicationEmails(...args),
  isMailConfigured: (...args: unknown[]) => isMailConfigured(...args),
}));

vi.mock("@/lib/ctd/recaptcha", () => ({
  verifyRecaptcha: (...args: unknown[]) => verifyRecaptcha(...args),
}));

vi.mock("@/lib/ctd/db", () => ({
  isDatabaseConfigured: (...args: unknown[]) => isDatabaseConfigured(...args),
}));

describe("POST /tournament-director/api/submit", () => {
  beforeEach(() => {
    insertApplication.mockReset();
    dispatchApplicationEmails.mockReset();
    verifyRecaptcha.mockReset();
    isDatabaseConfigured.mockReset();
    isMailConfigured.mockReset();
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("validates, checks reCAPTCHA, and writes through the existing mappings", async () => {
    isDatabaseConfigured.mockReturnValue(true);
    isMailConfigured.mockReturnValue(true);
    verifyRecaptcha.mockResolvedValue({ ok: true });
    insertApplication.mockResolvedValue({
      id: "app-1",
      submittedAt: "2020-01-01T00:00:00.000Z",
    });
    dispatchApplicationEmails.mockResolvedValue({
      mode: "smtp",
      autoReplyFailed: false,
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/tournament-director/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(VALID_SUBMIT_BODY),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message:
        "Thank you. Your application has been received and a confirmation email is on its way.",
    });
    expect(verifyRecaptcha).toHaveBeenCalledWith("test-token", "");
    expect(insertApplication).toHaveBeenCalledTimes(1);
    const stored = insertApplication.mock.calls[0][0];
    expect(stored).not.toHaveProperty("agreeNoUnauthorizedEvents");
    expect(stored.agreeNotGuaranteed).toBe(true);
    expect(stored.agreeSelectionBasis).toBe(true);
    expect(stored.agreeAccurate).toBe(true);
    expect(stored.firstName).toBe("Jordan");
    expect(dispatchApplicationEmails).toHaveBeenCalledWith(stored);
  });

  it("does not insert when validation fails", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/tournament-director/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...VALID_SUBMIT_BODY, firstName: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(insertApplication).not.toHaveBeenCalled();
    expect(verifyRecaptcha).not.toHaveBeenCalled();
  });

  it("does not insert when reCAPTCHA fails", async () => {
    verifyRecaptcha.mockResolvedValue({
      ok: false,
      error: "Security verification failed. Please try again.",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/tournament-director/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(VALID_SUBMIT_BODY),
      }),
    );

    expect(response.status).toBe(400);
    expect(insertApplication).not.toHaveBeenCalled();
  });
});
