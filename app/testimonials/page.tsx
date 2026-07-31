import { PictureFrame } from "@/components/picture-frame";
import { testimonials } from "@/lib/site-data";

export default function TestimonialsPage() {
  return (
    <div className="page-shell section-spacing space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">Testimonials</p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          Show proof that the weekends work for both competitive and social players.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          Testimonials should reinforce the two-sided promise: well-run tennis plus a weekend people actually enjoy.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <PictureFrame
          src="/images/community-tennis.svg"
          alt="Illustrated tennis community group"
          eyebrow="Player stories"
          title="Real feedback works better when the page also feels welcoming and visual"
        />
        <div className="grid gap-6">
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
    </div>
  );
}
