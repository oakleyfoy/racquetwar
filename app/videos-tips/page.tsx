import { PictureFrame } from "@/components/picture-frame";
import { videosAndTips } from "@/lib/site-data";

export default function VideosTipsPage() {
  return (
    <div className="page-shell section-spacing space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">Videos & tips</p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          Practical content that helps players feel ready, not a generic blog archive.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          This section should feature short videos, format explainers, event prep guidance, and practical tips that make
          Racquet War feel easier to understand and easier to join.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <PictureFrame
          src="/images/community-tennis.svg"
          alt="Illustrated tennis community scene"
          eyebrow="Helpful content"
          title="Use video and visual tips to make the format feel easier to understand"
        />
        <div className="grid gap-6">
          {videosAndTips.map((item) => (
            <article key={item.title} className="info-card rounded-[1.75rem] p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">{item.category}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
