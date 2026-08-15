import Link from "next/link";

import { CtdAccordion } from "@/components/ctd/ctd-accordion";
import { CheckIcon } from "@/components/ctd/ctd-icons";
import {
  PROGRAM_CANDIDATES,
  PROGRAM_COMPENSATION,
  PROGRAM_FAQS,
  PROGRAM_FINAL_CTA,
  PROGRAM_HERO,
  PROGRAM_INTRO,
  PROGRAM_PATH,
  PROGRAM_RESPONSIBILITIES,
  PROGRAM_SUPPORT,
  PROGRAM_TERRITORY,
} from "@/lib/ctd/program-content";
import {
  APPLICATION_PATH,
  CONTACT_EMAIL,
  CONTACT_NAME,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  CONTACT_TITLE,
  PROGRAM_SUPPORT_ID,
} from "@/lib/ctd/site";

function ApplyButton({
  className = "ctd-btn ctd-btn-primary",
}: {
  className?: string;
}) {
  return (
    <Link className={className} href={APPLICATION_PATH}>
      START YOUR APPLICATION
    </Link>
  );
}

export function CtdProgramPage() {
  return (
    <>
      <section className="ctd-hero">
        <div className="ctd-hero-inner">
          <p className="ctd-eyebrow">{PROGRAM_HERO.eyebrow}</p>
          <h1 className="ctd-title ctd-title-wide">{PROGRAM_HERO.title}</h1>
          {PROGRAM_HERO.paragraphs.map((paragraph) => (
            <p className="ctd-subtitle" key={paragraph}>
              {paragraph}
            </p>
          ))}
          <div className="ctd-hero-actions">
            <ApplyButton />
            <a className="ctd-btn ctd-btn-secondary" href={`#${PROGRAM_SUPPORT_ID}`}>
              EXPLORE THE PROGRAM
            </a>
          </div>
          <div className="ctd-hero-meta">
            {PROGRAM_HERO.badges.map((badge) => (
              <span className="ctd-pill" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main className="ctd-program">
        <section className="ctd-program-section" aria-labelledby="program-intro-heading">
          <div className="ctd-program-card ctd-program-card-overlap">
            <h2 className="ctd-program-heading" id="program-intro-heading">
              {PROGRAM_INTRO.heading}
            </h2>
            {PROGRAM_INTRO.paragraphs.map((paragraph) => (
              <p className="ctd-program-copy" key={paragraph}>
                {paragraph}
              </p>
            ))}
            <p className="ctd-notice">{PROGRAM_INTRO.note}</p>
          </div>
        </section>

        <section
          className="ctd-program-section"
          id={PROGRAM_SUPPORT_ID}
          aria-labelledby="program-support-heading"
        >
          <h2 className="ctd-program-heading" id="program-support-heading">
            {PROGRAM_SUPPORT.heading}
          </h2>
          <div className="ctd-support-grid">
            {PROGRAM_SUPPORT.cards.map((card) => {
              const Icon = card.icon;
              return (
                <article className="ctd-support-card" key={card.title}>
                  <div className="ctd-support-icon">
                    <Icon />
                  </div>
                  <h3 className="ctd-support-title">{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="ctd-program-section"
          aria-labelledby="program-candidates-heading"
        >
          <div className="ctd-program-card">
            <h2 className="ctd-program-heading" id="program-candidates-heading">
              {PROGRAM_CANDIDATES.heading}
            </h2>
            <p className="ctd-program-copy">{PROGRAM_CANDIDATES.intro}</p>
            <ul className="ctd-check-grid">
              {PROGRAM_CANDIDATES.qualifications.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="ctd-highlight">{PROGRAM_CANDIDATES.panel}</p>
          </div>
        </section>

        <section
          className="ctd-program-section"
          aria-labelledby="program-responsibilities-heading"
        >
          <h2 className="ctd-program-heading" id="program-responsibilities-heading">
            {PROGRAM_RESPONSIBILITIES.heading}
          </h2>
          <ul className="ctd-lead-grid">
            {PROGRAM_RESPONSIBILITIES.items.map((item) => (
              <li className="ctd-lead-card" key={item}>
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="ctd-warning" role="note">
            {PROGRAM_RESPONSIBILITIES.warning}
          </p>
        </section>

        <section
          className="ctd-program-section"
          aria-labelledby="program-path-heading"
        >
          <h2 className="ctd-program-heading" id="program-path-heading">
            {PROGRAM_PATH.heading}
          </h2>
          <ol className="ctd-path">
            {PROGRAM_PATH.steps.map((step, index) => (
              <li className="ctd-path-step" key={step.label}>
                <span className="ctd-path-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="ctd-path-label">{step.label}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="ctd-program-cta-row">
            <ApplyButton />
          </div>
        </section>

        <section
          className="ctd-program-section"
          aria-labelledby="program-compensation-heading"
        >
          <h2 className="ctd-program-heading" id="program-compensation-heading">
            {PROGRAM_COMPENSATION.heading}
          </h2>
          <div className="ctd-comp-grid">
            {PROGRAM_COMPENSATION.cards.map((card) => (
              <article className="ctd-program-card" key={card.title}>
                <h3 className="ctd-support-title">{card.title}</h3>
                {card.paragraphs.map((paragraph) => (
                  <p className="ctd-program-copy" key={paragraph}>
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}
          </div>
          <p className="ctd-fineprint ctd-comp-disclaimer">
            {PROGRAM_COMPENSATION.disclaimer}
          </p>
        </section>

        <section
          className="ctd-program-section"
          aria-labelledby="program-territory-heading"
        >
          <div className="ctd-program-card">
            <h2 className="ctd-program-heading" id="program-territory-heading">
              {PROGRAM_TERRITORY.heading}
            </h2>
            {PROGRAM_TERRITORY.paragraphs.map((paragraph) => (
              <p className="ctd-program-copy" key={paragraph}>
                {paragraph}
              </p>
            ))}
            <ul className="ctd-check-grid">
              {PROGRAM_TERRITORY.conditions.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="ctd-highlight">{PROGRAM_TERRITORY.highlight}</p>
          </div>
        </section>

        <section
          className="ctd-program-section"
          aria-labelledby="program-faq-heading"
        >
          <h2 className="ctd-program-heading" id="program-faq-heading">
            Frequently Asked Questions
          </h2>
          <CtdAccordion items={PROGRAM_FAQS} />
        </section>
      </main>

      <section className="ctd-final-cta" aria-labelledby="program-final-heading">
        <div className="ctd-final-cta-inner">
          <h2 className="ctd-title ctd-title-wide" id="program-final-heading">
            {PROGRAM_FINAL_CTA.heading}
          </h2>
          <p className="ctd-subtitle">{PROGRAM_FINAL_CTA.body}</p>
          <div className="ctd-program-cta-row">
            <ApplyButton className="ctd-btn ctd-btn-primary" />
          </div>
          <address className="ctd-contact-block">
            <strong>{CONTACT_NAME}</strong>
            <span>{CONTACT_TITLE}</span>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href={`tel:${CONTACT_PHONE_TEL}`}>{CONTACT_PHONE}</a>
          </address>
          <p className="ctd-final-disclaimer">{PROGRAM_FINAL_CTA.disclaimer}</p>
        </div>
      </section>
    </>
  );
}
