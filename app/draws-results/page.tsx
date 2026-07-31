import Link from "next/link";

import { PictureFrame } from "@/components/picture-frame";
import { featuredEvents } from "@/lib/site-data";

export default function DrawsResultsPage() {
  return (
    <div className="page-shell section-spacing space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">Draws & results</p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          Make draws and results easy to find before players ever need to ask.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          This page becomes the fast route for repeat players who already know the event they need and just want the
          latest information without friction.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="info-card rounded-[1.75rem] p-7">
          <h2 className="text-2xl font-semibold text-slate-900">Recommended structure</h2>
          <ul className="mt-5 space-y-3 text-base leading-7 text-slate-600">
            <li>Current events first</li>
            <li>Large buttons for draws, schedules, and results</li>
            <li>Date and location visible at a glance</li>
            <li>Archive older events lower on the page</li>
            <li>Keep the wording consistent across every event</li>
          </ul>
        </div>
          <PictureFrame
            src="/images/draw-board.svg"
            alt="Illustrated tournament draw board"
            eyebrow="Fast access"
            title="Repeat players should be able to jump to results in seconds"
          />
        </div>

        <div className="grid gap-5">
          {featuredEvents.map((event) => (
            <div key={event.slug} id={event.slug} className="info-card rounded-[1.75rem] p-7 scroll-mt-28">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">{event.dateLabel}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{event.title}</h2>
              <p className="mt-2 text-base text-slate-600">{event.location}</p>
              <div className="mt-4 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                {event.status}
              </div>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href={`/events/${event.slug}`}
                  className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-sky-300"
                >
                  Event details
                </Link>
                <Link
                  href={event.drawsHref}
                  className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                >
                  Draws & results
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
