import Link from "next/link";

import { PictureFrame } from "@/components/picture-frame";

export default function ContactPage() {
  return (
    <div className="page-shell section-spacing space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">Contact</p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          Make it easy for players to get an answer quickly.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          Contact options should feel simple and direct, especially for players who prefer calling or emailing rather
          than filling out a long form.
        </p>
      </section>

      <PictureFrame
        src="/images/event-crowd.svg"
        alt="Illustrated event scene"
        eyebrow="Need help?"
        title="Good support starts with easy answers and a clear path to the right event page"
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="info-card rounded-[1.75rem] p-7">
          <h2 className="text-2xl font-semibold text-slate-900">Call</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">1 (800) 813-3001</p>
        </div>
        <div className="info-card rounded-[1.75rem] p-7">
          <h2 className="text-2xl font-semibold text-slate-900">Email</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">hello@racquetwar.com</p>
        </div>
        <div className="info-card rounded-[1.75rem] p-7">
          <h2 className="text-2xl font-semibold text-slate-900">Need event details first?</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            The new site should answer most questions directly from the event page before a player ever has to reach
            out.
          </p>
          <Link
            href="/events"
            className="mt-6 inline-flex rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            Browse events
          </Link>
        </div>
      </section>
    </div>
  );
}
