import Link from "next/link";

export function AdminPortalNav() {
  return (
    <nav className="ctd-buttonrow" aria-label="Administration">
      <Link className="ctd-tablelink" href="/tournament-director/admin">
        Applicants
      </Link>
      <Link className="ctd-tablelink" href="/tournament-director/admin/events">
        Event proposals
      </Link>
      <Link
        className="ctd-tablelink"
        href="/tournament-director/admin/sponsorships"
      >
        Sponsorships
      </Link>
      <Link className="ctd-tablelink" href="/tournament-director/admin/directors">
        Directors
      </Link>
    </nav>
  );
}
