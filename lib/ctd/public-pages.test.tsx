import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: function Image({
    alt,
    src,
  }: {
    alt: string;
    src: string;
  }) {
    return <img alt={alt} src={src} />; // test mock; not shipped to production
  },
}));

vi.mock("next/link", () => ({
  default: function Link({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  },
}));

vi.mock("next/script", () => ({
  default: function Script() {
    return null;
  },
}));

vi.mock("@/components/ctd/ctd-application-form", () => ({
  CtdApplicationForm: function CtdApplicationForm() {
    return <div>Application form</div>;
  },
}));

import { CtdProgramPage } from "@/components/ctd/ctd-program-page";
import { CtdSiteFooter } from "@/components/ctd/ctd-site-footer";
import { CtdSiteHeader } from "@/components/ctd/ctd-site-header";
import TournamentDirectorPage from "@/app/tournament-director/page";
import TournamentDirectorProgramRoute from "@/app/tournament-director-program/page";

describe("public pages", () => {
  it("renders the program information page with CTAs to the application", () => {
    const html = renderToStaticMarkup(<CtdProgramPage />);

    expect(html).toContain("Bring Racquet War to Your Market");
    expect(html).toContain("What War Tournaments Provides");
    expect(html).toContain('id="program-support"');
    expect(html).toContain("War Tournaments LLC");
    expect(html).toContain("Oakley@WarGroupLLC.com");
    expect(html).toContain("(901) 359-3035");
    expect(html).toContain('href="/tournament-director"');
    expect(html).toContain("START YOUR APPLICATION");
    expect(html).toContain('href="#program-support"');
    expect(html).toContain("EXPLORE THE PROGRAM");
    expect(html).not.toMatch(/Founding/i);
    expect(html).not.toMatch(/exclusive territor/i);
    expect(html).not.toMatch(/\b(?:19|20)\d{2}\b/);
    expect(html).not.toContain("<form");
  });

  it("exports the program route page", () => {
    const html = renderToStaticMarkup(<TournamentDirectorProgramRoute />);
    expect(html).toContain("Bring Racquet War to Your Market");
  });

  it("renders the application hero with a link back to the program page", () => {
    const html = renderToStaticMarkup(<TournamentDirectorPage />);

    expect(html).toContain("Apply to Become an RW Certified Tournament Director");
    expect(html).toContain("RW Certified Tournament Director Program");
    expect(html).toContain("LEARN ABOUT THE PROGRAM");
    expect(html).toContain('href="/tournament-director-program"');
    expect(html).toContain("Initial group of 5–8 candidates");
    expect(html).not.toMatch(/Founding/i);
    expect(html).not.toMatch(/exclusive territor/i);
  });

  it("renders the shared header and footer without a copyright year", () => {
    const header = renderToStaticMarkup(<CtdSiteHeader />);
    const footer = renderToStaticMarkup(<CtdSiteFooter />);

    expect(header).toContain("Certified Tournament Director");
    expect(header).toContain("wartournaments.com");
    expect(footer).toContain("Questions about the program?");
    expect(footer).toContain("Oakley@WarGroupLLC.com");
    expect(footer).toContain("(901) 359-3035");
    expect(footer).toContain("War Tournaments LLC | Racquet War");
    expect(footer).not.toMatch(/©/);
    expect(footer).not.toMatch(/\b(?:19|20)\d{2}\b/);
  });
});
