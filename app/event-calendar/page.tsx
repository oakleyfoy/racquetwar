import Link from "next/link";

import { PictureFrame } from "@/components/picture-frame";
import { featuredEvents } from "@/lib/site-data";

export default function EventCalendarPage() {
  return (
    <div className="page-shell section-spacing space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">Event calendar</p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          A calendar view that makes it easier to compare tennis weekends at a glance.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          This page is meant for players who are choosing between dates and locations first, then drilling into the
          event page once they find the right fit.
        </p>
      </section>

      <PictureFrame
        src="/images/draw-board.svg"
        alt="Illustrated schedule and draw board"
        eyebrow="Compare quickly"
        title="Calendar and draw tools should feel clear the moment players land here"
      />

      <section className="info-card overflow-hidden rounded-[2rem]">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr] gap-4 border-b border-sky-100 px-6 py-5 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
          <span>Event</span>
          <span>Date</span>
          <span>Location</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-sky-100">
          {featuredEvents.map((event) => (
            <div key={event.slug} className="grid gap-4 px-6 py-6 md:grid-cols-[1.2fr_1fr_1fr_0.8fr] md:items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{event.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{event.style}</p>
              </div>
              <p className="text-sm leading-6 text-slate-700">{event.dateLabel}</p>
              <p className="text-sm leading-6 text-slate-700">{event.location}</p>
              <div className="flex flex-col gap-3 md:items-start">
                <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                  {event.status}
                </span>
                <Link href={`/events/${event.slug}`} className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-600">
                  View event
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="info-card rounded-[1.75rem] p-7">
          <h2 className="text-2xl font-semibold text-slate-900">Best for planners</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Players comparing locations and dates can quickly scan the options without clicking into multiple pages.
          </p>
        </div>
        <div className="info-card rounded-[1.75rem] p-7">
          <h2 className="text-2xl font-semibold text-slate-900">Best for repeat groups</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Returning groups often start with the calendar and then move to the event page once they agree on the weekend.
          </p>
        </div>
        <div className="info-card rounded-[1.75rem] p-7">
          <h2 className="text-2xl font-semibold text-slate-900">Best for clarity</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            It reduces friction for your audience by making the structure feel familiar and easy to scan on desktop.
          </p>
        </div>
      </section>
    </div>
  );
}
