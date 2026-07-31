import Image from "next/image";
import Link from "next/link";

import type { EventItem } from "@/lib/site-data";

type EventCardProps = {
  event: EventItem;
};

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
      <div className="relative aspect-[16/10]">
        <Image src={event.imageSrc} alt={event.imageAlt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/10 to-transparent" />
      </div>
      <div className="border-b border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.35),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(240,249,255,0.96))] p-6">
        <p className="text-sm font-medium text-cyan-700">{event.dateLabel}</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">{event.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{event.location}</p>
        <div className="mt-4 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
          {event.status}
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <div className="rounded-2xl bg-sky-50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-700">Levels</p>
            <p className="mt-2 leading-6">{event.level}</p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-700">Format</p>
            <p className="mt-2 leading-6">{event.format}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-sky-50 p-4 text-sm text-slate-700">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-700">Best fit</p>
          <p className="mt-2 leading-6">{event.support}</p>
        </div>

        <p className="text-sm leading-7 text-slate-600">{event.overview}</p>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/events/${event.slug}`}
            className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            View Event
          </Link>
          <Link
            href="/draws-results"
            className="rounded-full border border-sky-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-sky-300"
          >
            Draws & Results
          </Link>
        </div>
      </div>
    </article>
  );
}
