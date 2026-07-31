import Link from "next/link";

import { EventCard } from "@/components/event-card";
import { PictureFrame } from "@/components/picture-frame";
import { faqs, featuredEvents, howItWorks, siteStats, testimonials, valueProps, videosAndTips } from "@/lib/site-data";

export default function HomePage() {
  return (
    <div>
      <section className="page-shell section-spacing">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="usa-badge">USA Tournament Series</div>
              <p className="eyebrow">Not only a Tennis Tournament, but an Experience</p>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
                Let us be your Tennis Vacation
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Join our well-organized tournament at beautiful resorts. Experience the fun, creating lasting memories.
                Play with your favorite person regardless of their rating!
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/events"
                className="rounded-full bg-cyan-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-cyan-500"
              >
                View Upcoming Events
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-full border border-sky-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-sky-300"
              >
                How It Works
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {siteStats.map((stat) => (
                <div key={stat.label} className="info-card rounded-[1.75rem] p-5">
                  <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <PictureFrame
              src="/images/hero-tennis.svg"
              alt="Illustrated tennis court scene with players and a match in progress"
              eyebrow="The perfect tennis getaway"
              title="Whether you are international or stateside"
            />
            <div className="hero-card patriotic-band stars-panel patriotic-hero rounded-[2rem] p-6 sm:p-8">
              <div className="soft-grid rounded-[1.75rem] border border-sky-100 bg-[linear-gradient(135deg,_rgba(198,40,60,0.12),_rgba(255,255,255,0.95),_rgba(29,79,145,0.14))] p-8">
              <p className="eyebrow">Why we exist</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">Our Tournaments offer</h2>
              <ul className="mt-6 space-y-4 text-base leading-7 text-slate-600">
                <li>
                  We exist to provide you with a well-organized, exciting tournament-style environment to enjoy the
                  sport you love in some of the most beautiful places around the country and surrounding travel
                  destinations.
                </li>
              </ul>
              <div className="mt-8 rounded-[1.5rem] border border-[#163c6e] bg-white/90 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">Why choose us</p>
                <p className="mt-3 text-base leading-7 text-slate-700">
                  #1 Adult Recreational Tournament Provider. Averaging 40% returning players and 60% new players at
                  each event.
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="page-shell section-spacing">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Why choose us</p>
            <h2 className="text-4xl font-semibold text-slate-900">#1 Adult Recreational Tournament Provider</h2>
          </div>
          <Link href="/events" className="text-base font-semibold text-cyan-700 transition hover:text-cyan-600">
            View all tournaments
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {featuredEvents.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/event-calendar"
            className="rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-sky-300"
          >
            View Event Calendar
          </Link>
          <Link
            href="/draws-results"
            className="rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-sky-300"
          >
            Go to Draws & Results
          </Link>
        </div>
      </section>

      <section className="page-shell section-spacing">
        <div className="mb-10 space-y-3">
          <p className="eyebrow">Why we exist</p>
          <h2 className="text-4xl font-semibold text-slate-900">Our Tournaments offer</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6 lg:grid-cols-1">
          {valueProps.map((item) => (
            <div key={item.title} className="info-card rounded-[1.75rem] p-7">
              <h3 className="text-2xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
          <PictureFrame
            src="/images/event-crowd.svg"
            alt="Illustrated tournament crowd and court scene"
            eyebrow="Our history"
            title="Tennis without borders."
          />
        </div>
      </section>

      <section className="page-shell section-spacing">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <p className="eyebrow">Our history</p>
            <h2 className="text-4xl font-semibold text-slate-900">Tennis without borders.</h2>
            <p className="text-lg leading-8 text-slate-600">
              We have discovered some of the best resorts for a vacation centered around tennis, friendships, and fun.
              No place is too close or too far. We are even international! Bahamas and Cancun are proving to top the
              list of favorites. Amelia Island, FL, and Palm Springs, CA still remain the most beloved.
            </p>
          </div>

          <div className="grid gap-6">
            {howItWorks.map((item) => (
              <div key={item.step} className="info-card rounded-[1.75rem] p-7">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-lg font-semibold text-white">
                    {item.step}
                  </span>
                  <h3 className="text-2xl font-semibold text-slate-900">{item.title}</h3>
                </div>
                <p className="mt-4 text-base leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell section-spacing">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="eyebrow">Game On!</p>
            <h2 className="text-4xl font-semibold text-slate-900">Subscribe for Upcoming Tournament Alerts</h2>
            <p className="text-lg leading-8 text-slate-600">
              Be the first to know about upcoming tournaments, exciting matchups, and exclusive offers.
            </p>
          </div>

          <div className="grid gap-6">
            {videosAndTips.map((item) => (
              <div key={item.title} className="info-card rounded-[1.75rem] p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">{item.category}</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-4 text-base leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell section-spacing">
        <div className="mb-10 space-y-3">
          <p className="eyebrow">Why choose us</p>
          <h2 className="text-4xl font-semibold text-slate-900">Win or Lose, you will be planning your next Racquet War Event!</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="info-card rounded-[1.75rem] p-7">
              <p className="text-lg leading-8 text-slate-700">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-6">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{item.focus}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="page-shell section-spacing">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="eyebrow">FAQ</p>
            <h2 className="text-4xl font-semibold text-slate-900">Common Questions.</h2>
          </div>

          <div className="grid gap-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="info-card rounded-[1.5rem] p-6">
                <h3 className="text-xl font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell section-spacing">
        <div className="hero-card rounded-[2rem] p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="eyebrow">Need more help?</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-semibold text-slate-900">
                Game On! Subscribe for Upcoming Tournament Alerts
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Be the first to know about upcoming tournaments, exciting matchups, and exclusive offers.
              </p>
            </div>
            <div className="space-y-4">
              <PictureFrame
                src="/images/community-tennis.svg"
                alt="Illustrated group tennis weekend scene"
                eyebrow="Upcoming tournament alerts"
                title="Join now"
              />
              <div className="flex flex-wrap gap-4 lg:justify-end">
              <Link
                href="/events"
                className="rounded-full bg-cyan-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-cyan-500"
              >
                Explore Upcoming Tournaments
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-sky-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-sky-300"
              >
                Contact Us
              </Link>
            </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
