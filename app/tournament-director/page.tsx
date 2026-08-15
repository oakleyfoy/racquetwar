import Link from "next/link";

import { CtdApplicationForm } from "@/components/ctd/ctd-application-form";
import { PROGRAM_SUBTITLE, PROGRAM_TITLE } from "@/lib/ctd/fields";
import { getRecaptchaSiteKey } from "@/lib/ctd/recaptcha";
import {
  APPLICATION_EYEBROW,
  APPLICATION_HERO_BADGES,
  PROGRAM_PATH,
} from "@/lib/ctd/site";

// The site key is read per request so it can be changed without a rebuild.
export const dynamic = "force-dynamic";

export default function TournamentDirectorPage() {
  return (
    <>
      <section className="ctd-hero">
        <div className="ctd-hero-inner">
          <p className="ctd-hero-nav">
            <Link className="ctd-hero-textlink" href={PROGRAM_PATH}>
              LEARN ABOUT THE PROGRAM
            </Link>
          </p>
          <p className="ctd-eyebrow">{APPLICATION_EYEBROW}</p>
          <h1 className="ctd-title">{PROGRAM_TITLE}</h1>
          <p className="ctd-subtitle">{PROGRAM_SUBTITLE}</p>
          <div className="ctd-hero-meta">
            {APPLICATION_HERO_BADGES.map((badge) => (
              <span className="ctd-pill" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main className="ctd-main">
        <CtdApplicationForm
          recaptchaSiteKey={getRecaptchaSiteKey()}
          minTrainingDate={new Date().toISOString().slice(0, 10)}
        />
      </main>
    </>
  );
}
