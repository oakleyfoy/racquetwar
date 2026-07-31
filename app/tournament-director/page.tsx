import { CtdApplicationForm } from "@/components/ctd/ctd-application-form";
import { PROGRAM_SUBTITLE, PROGRAM_TITLE } from "@/lib/ctd/fields";
import { getRecaptchaSiteKey } from "@/lib/ctd/recaptcha";

// The site key is read per request so it can be changed without a rebuild.
export const dynamic = "force-dynamic";

export default function TournamentDirectorPage() {
  return (
    <>
      <section className="ctd-hero">
        <div className="ctd-hero-inner">
          <p className="ctd-eyebrow">Founding Program Application</p>
          <h1 className="ctd-title">{PROGRAM_TITLE}</h1>
          <p className="ctd-subtitle">{PROGRAM_SUBTITLE}</p>
          <div className="ctd-hero-meta">
            <span className="ctd-pill">Exclusive territories</span>
            <span className="ctd-pill">Limited founding positions</span>
            <span className="ctd-pill">Takes about 10 minutes</span>
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
