import type { Metadata } from "next";
import Image from "next/image";

import "./ctd.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://racquetwar.com";

export const metadata: Metadata = {
  title: "Apply to Become a Founding Certified Tournament Director | Racquet War",
  description:
    "Apply to join a select group of leaders who will launch and grow Racquet War tournaments in exclusive territories across the country and world.",
  alternates: {
    canonical: `${SITE_URL}/tournament-director`,
  },
  openGraph: {
    title: "Apply to Become a Founding Certified Tournament Director",
    description:
      "Join a select group of leaders who will launch and grow Racquet War tournaments in exclusive territories across the country and world.",
    url: `${SITE_URL}/tournament-director`,
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
          <a className="ctd-brandmark" href={SITE_URL}>
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
          <a className="ctd-topbar-link" href={SITE_URL}>
            Back to racquetwar.com
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
