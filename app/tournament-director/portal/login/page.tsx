import type { Metadata } from "next";

import { requestDirectorLoginAction } from "../actions";

export const metadata: Metadata = {
  title: "Director sign in | Racquet War",
  robots: { index: false, follow: false },
};

export default async function DirectorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="ctd-main">
      <div className="ctd-card ctd-login">
        <h1 className="ctd-section-title" style={{ marginBottom: 6 }}>
          Tournament Director portal
        </h1>
        <p className="ctd-section-hint" style={{ marginBottom: 22 }}>
          Enter the verified email on your activated Director record. We will
          send a one-time sign-in link. There is no shared Director password.
        </p>
        {params.sent ? (
          <div className="ctd-saved" role="status">
            If that email is on an active Director record, a sign-in link is on
            its way. The link expires and can be used once.
          </div>
        ) : null}
        {params.error === "invalid" ? (
          <div className="ctd-alert" role="alert">
            That sign-in link is invalid, expired, or has already been used.
            Request a new link.
          </div>
        ) : null}
        <form action={requestDirectorLoginAction}>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              className="ctd-input"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <button className="ctd-submit" type="submit" style={{ marginTop: 20 }}>
            Send sign-in link
          </button>
        </form>
      </div>
    </main>
  );
}
