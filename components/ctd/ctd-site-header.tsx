import Image from "next/image";

import { MAIN_SITE_LABEL, MAIN_SITE_URL } from "@/lib/ctd/site";

export function CtdSiteHeader() {
  return (
    <header className="ctd-topbar">
      <div className="ctd-topbar-inner">
        <a className="ctd-brandmark" href={MAIN_SITE_URL}>
          {/* Intrinsic size of the source file; CSS scales it to 54px tall. */}
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
          <span className="ctd-topbar-link-full">Back to {MAIN_SITE_LABEL}</span>
          <span className="ctd-topbar-link-short">Back</span>
        </a>
      </div>
    </header>
  );
}
