import { PictureFrame } from "@/components/picture-frame";
import { howItWorks } from "@/lib/site-data";

export default function HowItWorksPage() {
  return (
    <div className="page-shell section-spacing space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">How it works</p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          The event journey should feel easy from the first click.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          Clear structure is a competitive advantage for Racquet War. When the site answers the obvious questions fast,
          players feel more confident booking the weekend.
        </p>
      </section>

      <PictureFrame
        src="/images/draw-board.svg"
        alt="Illustrated schedule board and bracket"
        eyebrow="Make it obvious"
        title="The site should explain the process as clearly as the front desk would"
      />

      <section className="grid gap-6 lg:grid-cols-3">
        {howItWorks.map((item) => (
          <div key={item.step} className="info-card rounded-[1.75rem] p-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-lg font-semibold text-white">
              {item.step}
            </span>
            <h2 className="mt-5 text-2xl font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
