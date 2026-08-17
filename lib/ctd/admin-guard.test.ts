import { beforeEach, describe, expect, it, vi } from "vitest";

const getCookie = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const verifySessionToken = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

vi.mock("./admin-session", () => ({
  ADMIN_COOKIE: "ctd_admin_session",
  verifySessionToken: (...args: unknown[]) => verifySessionToken(...args),
}));

describe("requireAdminSession", () => {
  beforeEach(() => {
    getCookie.mockReset();
    redirect.mockClear();
    verifySessionToken.mockReset();
  });

  it("redirects an unauthenticated preview request to admin login", async () => {
    getCookie.mockReturnValue(undefined);
    verifySessionToken.mockResolvedValue(false);
    const { requireAdminSession } = await import("./admin-guard");

    await expect(requireAdminSession()).rejects.toThrow(
      "REDIRECT:/tournament-director/admin/login",
    );
  });

  it("allows an authenticated admin session to continue", async () => {
    getCookie.mockReturnValue({ value: "signed-admin" });
    verifySessionToken.mockResolvedValue(true);
    const { requireAdminSession } = await import("./admin-guard");

    await expect(requireAdminSession()).resolves.toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
  });
});
