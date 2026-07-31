import Link from "next/link";
import { notFound } from "next/navigation";

import { PictureFrame } from "@/components/picture-frame";
import { featuredEvents } from "@/lib/site-data";

type EventDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return featuredEvents.map((event) => ({ slug: event.slug }));
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = featuredEvents.find((item) => item.slug === slug);

  if (!event) {
    notFound();
  }

  return (
    <div className="page-shell section-spacing space-y-12">
      <section className="hero-card rounded-[2rem] p-8 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-start">
          <div className="space-y-6">
            <p className="eyebrow">{event.location}</p>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">{event.title}</h1>
              <p className="text-xl text-cyan-700">{event.dateLabel}</p>
              <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                {event.status}
              </div>
              <p className="max-w-3xl text-lg leading-8 text-slate-600">{event.overview}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href={event.registrationHref}
                className="rounded-full bg-cyan-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-cyan-500"
              >
                {event.registrationLabel}
              </Link>
              <Link
                href={event.drawsHref}
                className="rounded-full border border-sky-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-sky-300"
              >
                View Draws & Results
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <PictureFrame
              src={event.imageSrc}
              alt={event.imageAlt}
              eyebrow="Event preview"
              title={event.imageLabel}
            />
            <div className="info-card rounded-[1.75rem] p-6">
            <h2 className="text-2xl font-semibold text-slate-900">Quick facts</h2>
            <dl className="mt-5 space-y-4 text-base text-slate-600">
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Venue</dt>
                <dd className="mt-1 leading-7">{event.resort}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Levels</dt>
                <dd className="mt-1 leading-7">{event.level}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Format</dt>
                <dd className="mt-1 leading-7">{event.format}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Style</dt>
                <dd className="mt-1 leading-7">{event.style}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Stay options</dt>
                <dd className="mt-1 leading-7">{event.lodging}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Best fit</dt>
                <dd className="mt-1 leading-7">{event.support}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Photo style</dt>
                <dd className="mt-1 leading-7">{event.imageLabel}</dd>
              </div>
            </dl>
          </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="info-card rounded-[1.75rem] p-7">
          <p className="eyebrow">Weekend highlights</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Everything a player needs on one event page.</h2>
          <ul className="mt-6 space-y-4 text-base leading-7 text-slate-600">
            {event.highlights.map((item) => (
              <li key={item} className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="info-card rounded-[1.75rem] p-7">
          <p className="eyebrow">Recommended page modules</p>
          <div className="mt-4 space-y-4 text-base leading-7 text-slate-600">
            <p>Use this template for every event:</p>
            <ul className="space-y-3">
              <li>Overview and who the weekend is best for</li>
              <li>Format details and match guarantee</li>
              <li>Venue and stay options</li>
              <li>Schedule snapshot</li>
              <li>Registration and draws buttons near the top</li>
              <li>FAQs and contact help near the bottom</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="info-card rounded-[1.75rem] p-7">
          <p className="eyebrow">Schedule snapshot</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">A weekend timeline players can scan quickly.</h2>
          <div className="mt-6 grid gap-4">
            {event.schedule.map((item) => (
              <div key={item.day} className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">{item.day}</p>
                <p className="mt-3 text-base leading-7 text-slate-600">{item.details}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="info-card rounded-[1.75rem] p-7">
          <p className="eyebrow">Event FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Short answers close to the registration button.</h2>
          <div className="mt-6 space-y-4">
            {event.faqs.map((item) => (
              <div key={item.question} className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
