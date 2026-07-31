import type { Metadata } from "next";

import { isAdminConfigured } from "@/lib/ctd/admin-session";

import { loginAction } from "../actions";

export const metadata: Metadata = {
  title: "Admin sign in | Racquet War",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "That password was not correct. Please try again.",
  unconfigured:
    "No admin password is configured. Set ADMIN_PASSWORD in the environment to enable this area.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? ERROR_MESSAGES[error] : null;

  return (
    <main className="ctd-main">
      <div className="ctd-card ctd-login">
        <h1 className="ctd-section-title" style={{ marginBottom: 6 }}>
          Tournament Director applications
        </h1>
        <p className="ctd-section-hint" style={{ marginBottom: 22 }}>
          Enter the admin password to review submitted applications.
        </p>

        {message ? (
          <div className="ctd-alert" role="alert">
            {message}
          </div>
        ) : null}

        <form action={loginAction}>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              className="ctd-input"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
            />
          </div>

          <button
            className="ctd-submit"
            type="submit"
            style={{ marginTop: 20 }}
            disabled={!isAdminConfigured()}
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
