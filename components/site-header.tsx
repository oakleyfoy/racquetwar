"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/events", label: "Upcoming Events" },
  { href: "/event-calendar", label: "Event Calendar" },
  { href: "/draws-results", label: "Draws & Results" },
  { href: "/videos-tips", label: "Videos & Tips" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="patriotic-band sticky top-0 z-50 border-b border-[#163c6e] bg-[rgba(18,37,68,0.96)] text-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-white/20 bg-[#241f20] shadow-sm">
            <Image
              src="/images/racquet-war-logo-stacked.jpg"
              alt="Racquet War logo mark"
              fill
              className="object-cover object-top"
              sizes="44px"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">
              Racquet War
            </span>
            <span className="truncate text-base font-semibold text-white sm:text-lg">
              Competitive Tennis Tournaments
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition hover:text-white ${
                pathname === item.href || pathname.startsWith(`${item.href}/`) ? "text-white" : "text-white/75"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/events"
            className="rounded-full border border-white/20 bg-[#c6283c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a91f31]"
          >
            View Events
          </Link>
        </div>

        <details className="group lg:hidden">
          <summary className="list-none rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
            Menu
          </summary>
          <div className="absolute left-4 right-4 top-full mt-3 rounded-[1.5rem] border border-[#163c6e] bg-[#122544]/96 p-4 shadow-2xl backdrop-blur sm:left-6 sm:right-6">
            <nav className="grid gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-base font-medium transition hover:bg-white/10 hover:text-white ${
                    pathname === item.href || pathname.startsWith(`${item.href}/`) ? "bg-white/10 text-white" : "text-white/75"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/events"
                className="mt-2 rounded-full bg-[#c6283c] px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-[#a91f31]"
              >
                View Events
              </Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
