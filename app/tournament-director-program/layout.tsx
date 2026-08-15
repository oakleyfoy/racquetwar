import type { Metadata } from "next";

import { CtdSiteFooter } from "@/components/ctd/ctd-site-footer";
import { CtdSiteHeader } from "@/components/ctd/ctd-site-header";
import { APP_URL, PROGRAM_PATH, PROGRAM_SEO } from "@/lib/ctd/site";

import "../tournament-director/ctd.css";

export const metadata: Metadata = {
  title: PROGRAM_SEO.title,
  description: PROGRAM_SEO.description,
  alternates: {
    canonical: `${APP_URL}${PROGRAM_PATH}`,
  },
  openGraph: {
    title: PROGRAM_SEO.title,
    description: PROGRAM_SEO.description,
    url: `${APP_URL}${PROGRAM_PATH}`,
    siteName: "War Tournaments",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: PROGRAM_SEO.title,
    description: PROGRAM_SEO.description,
  },
};

export default function TournamentDirectorProgramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ctd">
      <CtdSiteHeader />
      {children}
      <CtdSiteFooter />
    </div>
  );
}
