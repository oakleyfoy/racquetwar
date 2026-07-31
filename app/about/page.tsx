import { PictureFrame } from "@/components/picture-frame";

export default function AboutPage() {
  return (
    <div className="page-shell section-spacing space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">About Racquet War</p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          ABOUT RACQUET WAR
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          Racquet War was first started in 2009 by Oakley Foy and Robin Barringer. The first destination tournaments
          were held once a year at the Saddlebrook Resort, just outside of Tampa, FL. Over the next couple of years,
          Racquet War tried many different formats, including NTRP division, age divisions, World Team Tennis, and
          even prize money events, in all different cities like Houston and Atlanta. Everything was &ldquo;kind of&rdquo;
          successful already, but they took off when Oakley developed the Waterfall Bracket format which is still in
          use today. It was developed with the players in mind, allowing anyone to play with anyone; their NTRP&apos;s
          didn&apos;t matter anymore.
        </p>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          At Racquet War, we&apos;re all about fun, friends, and tennis. Our tournaments are open to all levels and
          designed for mixed and women&apos;s doubles players aged 18 and up. While our events won&apos;t affect your USTA
          rating, you can still expect plenty of friendly competition on court. Each tournament is more than just a
          match, it&apos;s a vacation experience, complete with great resort deals, social events, and the chance to make
          lifelong tennis friends.
        </p>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          In addition to our tournaments, we also offer Racquet War Experiences, fully curated tennis vacations with
          everything included. Our tournaments typically run 3 to 4 days, and players can choose to pay just the entry
          fee or bundle it with a discounted stay at one of our partner resorts. We host events in destinations like
          South Carolina, Florida, Palm Springs, the Bahamas, and Cancun.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <PictureFrame
          src="/images/hero-tennis.svg"
          alt="Illustrated tennis match scene"
          eyebrow="Fun, friends, and tennis"
          title="A vacation experience with great tennis"
        />
        <div className="grid gap-6 lg:grid-cols-3">
        <div className="info-card rounded-[1.75rem] p-7">
          <h2 className="text-2xl font-semibold text-slate-900">Waterfall Bracket</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            The format that helped Racquet War take off and is still in use today, developed with the players in mind.
          </p>
        </div>
        <div className="info-card rounded-[1.75rem] p-7">
          <h2 className="text-2xl font-semibold text-slate-900">Open to all levels</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Mixed and women&apos;s doubles players aged 18 and up are welcome, with plenty of friendly competition on court.
          </p>
        </div>
        <div className="info-card rounded-[1.75rem] p-7">
          <h2 className="text-2xl font-semibold text-slate-900">More than a match</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Each tournament is more than just a match, it&apos;s a chance to make friends, have fun, and plan the next one.
          </p>
        </div>
        </div>
      </section>
    </div>
  );
}
