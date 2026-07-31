import type { Metadata } from "next";
import Image from "next/image";

import "./ctd.css";

/** Where this application is served from, used for canonical and share URLs. */
const APP_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://apply.wartournaments.com"
).replace(/\/+$/, "");

/**
 * Where the logo and the back button lead. Deliberately separate from APP_URL:
 * Racquet War events are run by War Tournaments now, and racquetwar.com only
 * serves a notice saying so, which is a dead end mid-application.
 */
const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_MAIN_SITE_URL ??
  "https://wartournaments.com/racquet-war/";

/** Derived so the button text cannot drift from where it actually points. */
const MAIN_SITE_LABEL = new URL(MAIN_SITE_URL).hostname.replace(/^www\./, "");

export const metadata: Metadata = {
  title: "Apply to Become a Founding Certified Tournament Director | Racquet War",
  description:
    "Apply to join a select group of leaders who will launch and grow Racquet War tournaments in exclusive territories across the country and world.",
  alternates: {
    canonical: `${APP_URL}/tournament-director`,
  },
  openGraph: {
    title: "Apply to Become a Founding Certified Tournament Director",
    description:
      "Join a select group of leaders who will launch and grow Racquet War tournaments in exclusive territories across the country and world.",
    url: `${APP_URL}/tournament-director`,
    siteName: "Racquet War",
    type: "website",
  },
};

export default function TournamentDirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ctd">
      <div className="ctd-topbar">
        <div className="ctd-topbar-inner">
          <a className="ctd-brandmark" href={MAIN_SITE_URL}>
            {/* Intrinsic size of the source file; CSS scales it to 40px tall. */}
            <Image
              src="/images/racquet-war-logo.jpg"
              alt="Racquet War"
              width={744}
              height={366}
              priority
            />
            <span>Certified Tournament Director</span>
          </a>
          <a className="ctd-topbar-link" href={MAIN_SITE_URL}>
            Back to {MAIN_SITE_LABEL}
          </a>
        </div>
      </div>

      {children}

      <footer className="ctd-pagefooter">
        <p>
          Questions about the program? Email{" "}
          <a href="mailto:info@racquetwar.com">info@racquetwar.com</a>.
        </p>
        <p>
          &copy; {new Date().getFullYear()} Racquet War. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
