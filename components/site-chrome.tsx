"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Routes that render their own header and footer instead of the site shell. */
const SELF_CONTAINED_ROUTES = ["/tournament-director"];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const selfContained = SELF_CONTAINED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (selfContained) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
