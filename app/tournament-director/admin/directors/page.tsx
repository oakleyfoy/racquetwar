import type { Metadata } from "next";

import { AdminPortalNav } from "@/components/ctd/admin-portal-nav";
import { requireAdminSession } from "@/lib/ctd/admin-guard";
import { listDirectors } from "@/lib/ctd/director-db";

import { sendDirectorLoginAction, setDirectorActiveAction } from "../portal-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Directors | CTD admin",
  robots: { index: false, follow: false },
};

export default async function AdminDirectorsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdminSession();
  const { notice } = await searchParams;
  const directors = await listDirectors();

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <AdminPortalNav />
        <h1 className="ctd-section-title">Director access</h1>
        <p className="ctd-section-hint">
          Access is tied to an activated Director record and verified email.
          There is no shared Director password.
        </p>
        {notice ? <div className="ctd-saved" role="status">Updated.</div> : null}
        {directors.length === 0 ? (
          <p className="ctd-empty">No Director records yet. Activate access from a Selected application.</p>
        ) : (
          <ul className="ctd-activitylist">
            {directors.map((director) => (
              <li key={director.id}>
                <strong>
                  {director.firstName} {director.lastName}
                </strong>
                <div className="ctd-subtle">{director.email}</div>
                <div className="ctd-subtle">Status: {director.status}</div>
                <div className="ctd-buttonrow">
                  {director.status === "active" ? (
                    <>
                      <form action={sendDirectorLoginAction}>
                        <input type="hidden" name="directorId" value={director.id} />
                        <button className="ctd-addbutton" type="submit">
                          Send sign-in link
                        </button>
                      </form>
                      <form action={setDirectorActiveAction}>
                        <input type="hidden" name="directorId" value={director.id} />
                        <input type="hidden" name="active" value="0" />
                        <button className="ctd-deletebutton" type="submit">
                          Deactivate access
                        </button>
                      </form>
                    </>
                  ) : (
                    <form action={setDirectorActiveAction}>
                      <input type="hidden" name="directorId" value={director.id} />
                      <input type="hidden" name="active" value="1" />
                      <button className="ctd-addbutton" type="submit">
                        Reactivate access
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
