import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell section-spacing">
      <section className="hero-card mx-auto max-w-4xl rounded-[2rem] p-10 text-center">
        <p className="eyebrow">Page not found</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">Let&apos;s get you back to the right event.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          The page you were looking for is not here, but the key sections of the site are designed to make recovery
          easy.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/events"
            className="rounded-full bg-cyan-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-cyan-500"
          >
            View upcoming events
          </Link>
          <Link
            href="/draws-results"
            className="rounded-full border border-sky-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-sky-300"
          >
            Go to draws & results
          </Link>
        </div>
      </section>
    </div>
  );
}
