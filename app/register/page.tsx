import Link from "next/link";

import { PictureFrame } from "@/components/picture-frame";
import { featuredEvents } from "@/lib/site-data";

type RegisterPageProps = {
  searchParams?: Promise<{
    event?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const selectedEvent = featuredEvents.find((event) => event.slug === params.event) ?? featuredEvents[0];

  return (
    <div className="page-shell section-spacing space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">Register</p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          A clearer registration starting point for players who just want the next step.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          This preview uses a simple local intake page. In the live build, this can connect to your final registration
          workflow or external event system.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <PictureFrame
            src={selectedEvent.imageSrc}
            alt={selectedEvent.imageAlt}
            eyebrow="Quick next step"
            title="The path from event page to sign-up should feel simple"
          />
          <div className="hero-card rounded-[2rem] p-8">
          <p className="eyebrow">Selected event</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">{selectedEvent.title}</h2>
          <p className="mt-4 text-lg text-cyan-700">{selectedEvent.dateLabel}</p>
          <p className="mt-2 text-base text-slate-600">{selectedEvent.location}</p>
          <div className="mt-6 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
            {selectedEvent.status}
          </div>
          <p className="mt-6 text-base leading-7 text-slate-600">{selectedEvent.overview}</p>
          <div className="mt-8 space-y-3 text-sm text-slate-600">
            <p>Best fit: {selectedEvent.support}</p>
            <p>Stay options: {selectedEvent.lodging}</p>
          </div>
        </div>
        </div>

        <div className="info-card rounded-[2rem] p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Registration request</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            This is a preview-friendly form layout so you can review the local site experience now.
          </p>

          <form className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-900">Player name</span>
              <input
                className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-900 outline-none ring-0 placeholder:text-slate-400"
                placeholder="Your full name"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-900">Email</span>
              <input
                type="email"
                className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-900 outline-none ring-0 placeholder:text-slate-400"
                placeholder="name@email.com"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-900">Phone</span>
              <input
                className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-900 outline-none ring-0 placeholder:text-slate-400"
                placeholder="Best number to reach you"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-900">Event</span>
              <select
                defaultValue={selectedEvent.slug}
                className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-900 outline-none"
              >
                {featuredEvents.map((event) => (
                  <option key={event.slug} value={event.slug}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-900">Message</span>
              <textarea
                rows={5}
                className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Questions about accommodations, divisions, or partner options"
              />
            </label>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                className="rounded-full bg-cyan-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-cyan-500"
              >
                Send Registration Request
              </button>
              <Link
                href={`/events/${selectedEvent.slug}`}
                className="rounded-full border border-sky-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-sky-300"
              >
                Back to event page
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
