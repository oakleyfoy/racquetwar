import Link from "next/link";

import { PortalNav } from "@/components/ctd/portal-nav";
import { requireDirectorSession } from "@/lib/ctd/director-guard";
import { EVENT_STATUS_LABELS } from "@/lib/ctd/portal-domain";
import { listEventProposals } from "@/lib/ctd/portal-db";
import { formatSubmittedAt } from "@/lib/ctd/report";

import { startEventProposalAction } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DirectorEventsPage() {
  const director = await requireDirectorSession();
  const events = await listEventProposals({ directorId: director.id });

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <PortalNav director={director} />
        <div className="ctd-admin-head">
          <div>
            <h1 className="ctd-section-title">Event proposals</h1>
            <p className="ctd-section-hint">{events.length} proposal{events.length === 1 ? "" : "s"}</p>
          </div>
          <form action={startEventProposalAction}>
            <button className="ctd-submit" type="submit">
              New proposal
            </button>
          </form>
        </div>
        {events.length === 0 ? (
          <p className="ctd-empty">No event proposals yet.</p>
        ) : (
          <ul className="ctd-activitylist">
            {events.map((event) => (
              <li key={event.id}>
                <Link className="ctd-tablelink" href={`/tournament-director/portal/events/${event.id}`}>
                  {event.eventName || "Untitled proposal"}
                </Link>
                <div className="ctd-subtle">
                  <span className={`ctd-badge ctd-badge-${event.currentStatus}`}>
                    {EVENT_STATUS_LABELS[event.currentStatus]}
                  </span>{" "}
                  Updated {formatSubmittedAt(event.updatedAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
