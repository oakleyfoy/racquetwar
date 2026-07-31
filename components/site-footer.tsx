import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/events", label: "Upcoming Events" },
  { href: "/event-calendar", label: "Event Calendar" },
  { href: "/draws-results", label: "Draws & Results" },
  { href: "/videos-tips", label: "Videos & Tips" },
  { href: "/register", label: "Register" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="patriotic-band border-t border-[#163c6e] bg-[#122544] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/20 bg-[#241f20] shadow-sm">
              <Image
                src="/images/racquet-war-logo-stacked.jpg"
                alt="Racquet War logo mark"
                fill
                className="object-cover object-top"
                sizes="48px"
              />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">
              Racquet War
            </p>
          </div>
          <h2 className="max-w-xl text-2xl font-semibold text-white">
            Not only a Tennis Tournament, but an Experience.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-white/75">
            Join our well-organized tournament at beautiful resorts. Experience the fun, creating lasting memories.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Quick links</h3>
            <ul className="space-y-2 text-sm text-white/75">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Contact</h3>
            <ul className="space-y-2 text-sm text-white/75">
              <li>1 (800) 813-3001</li>
              <li>hello@racquetwar.com</li>
              <li>Built for easy event planning and repeat players.</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
