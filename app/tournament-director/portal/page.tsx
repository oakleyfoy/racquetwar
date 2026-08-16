import Link from "next/link";

import { PortalNav } from "@/components/ctd/portal-nav";
import { requireDirectorSession } from "@/lib/ctd/director-guard";
import { directorDisplayName } from "@/lib/ctd/director-db";
import { listEventProposals, listSponsorships } from "@/lib/ctd/portal-db";

import {
  startEventProposalAction,
  startSponsorshipAction,
} from "./actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DirectorPortalHomePage() {
  const director = await requireDirectorSession();
  const [events, sponsorships] = await Promise.all([
    listEventProposals({ directorId: director.id }),
    listSponsorships({ directorId: director.id }),
  ]);

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <PortalNav director={director} />
        <h1 className="ctd-section-title">Director portal</h1>
        <p className="ctd-section-hint">
          Welcome, {directorDisplayName(director)}. Submit proposed events and
          sponsorship requests for written review by War Tournaments LLC.
        </p>
        <div className="ctd-buttonrow">
          <form action={startEventProposalAction}>
            <button className="ctd-submit" type="submit">
              Start event proposal
            </button>
          </form>
          <form action={startSponsorshipAction}>
            <button className="ctd-addbutton" type="submit">
              Start sponsorship request
            </button>
          </form>
        </div>
        <p className="ctd-subtle">
          {events.length} event proposal{events.length === 1 ? "" : "s"} ·{" "}
          {sponsorships.length} sponsorship request
          {sponsorships.length === 1 ? "" : "s"}
        </p>
        <div className="ctd-buttonrow">
          <Link className="ctd-tablelink" href="/tournament-director/portal/events">
            View event proposals
          </Link>
          <Link
            className="ctd-tablelink"
            href="/tournament-director/portal/sponsorships"
          >
            View sponsorships
          </Link>
        </div>
      </div>
    </main>
  );
}
