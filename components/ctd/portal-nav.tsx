import Link from "next/link";

import { directorLogoutAction } from "@/app/tournament-director/portal/actions";
import type { DirectorRecord } from "@/lib/ctd/director-db";
import { directorDisplayName } from "@/lib/ctd/director-db";

export function PortalNav({
  director,
}: {
  director: DirectorRecord;
}) {
  return (
    <div className="ctd-admin-head" style={{ marginTop: 8 }}>
      <nav className="ctd-buttonrow" aria-label="Director portal">
        <Link className="ctd-tablelink" href="/tournament-director/portal">
          Portal home
        </Link>
        <Link className="ctd-tablelink" href="/tournament-director/portal/events">
          Event proposals
        </Link>
        <Link
          className="ctd-tablelink"
          href="/tournament-director/portal/sponsorships"
        >
          Sponsorships
        </Link>
      </nav>
      <div className="ctd-admin-actions">
        <span className="ctd-subtle">{directorDisplayName(director)}</span>
        <form action={directorLogoutAction}>
          <button className="ctd-linkbutton" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
