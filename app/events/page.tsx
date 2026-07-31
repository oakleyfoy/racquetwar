import { EventCard } from "@/components/event-card";
import { PictureFrame } from "@/components/picture-frame";
import Link from "next/link";

import { eventQuickFilters, featuredEvents } from "@/lib/site-data";

export default function EventsPage() {
  return (
    <div className="page-shell section-spacing space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">Upcoming events</p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          Browse the next Racquet War weekends without digging for details.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          Every event should quickly answer the same player questions: where it is, when it runs, who it is for, how
          the format works, and where to register or find draws.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          {eventQuickFilters.map((item) => (
            <div key={item.title} className="info-card rounded-[1.75rem] p-7">
              <h2 className="text-2xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{item.body}</p>
              <Link
                href={item.href}
                className="mt-6 inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-sky-300"
              >
                {item.cta}
              </Link>
            </div>
          ))}
        </div>
        <PictureFrame
          src="/images/event-crowd.svg"
          alt="Illustrated tournament event scene with players and spectators"
          eyebrow="At a glance"
          title="Events should feel visual and easy to compare"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {featuredEvents.map((event) => (
          <EventCard key={event.slug} event={event} />
        ))}
      </section>
    </div>
  );
}
