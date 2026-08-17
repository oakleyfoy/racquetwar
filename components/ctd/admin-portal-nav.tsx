import Link from "next/link";

export function AdminPortalNav() {
  return (
    <nav className="ctd-admin-nav" aria-label="Administration">
      <Link className="ctd-admin-navlink" href="/tournament-director/admin">
        Applicants
      </Link>
      <Link className="ctd-admin-navlink" href="/tournament-director/admin/events">
        Event proposals
      </Link>
      <Link
        className="ctd-admin-navlink"
        href="/tournament-director/admin/sponsorships"
      >
        Sponsorships
      </Link>
      <Link className="ctd-admin-navlink" href="/tournament-director/admin/directors">
        Directors
      </Link>
      <Link
        className="ctd-admin-navlink"
        href="/tournament-director/admin/forms-preview"
      >
        Preview Director Forms
      </Link>
    </nav>
  );
}
