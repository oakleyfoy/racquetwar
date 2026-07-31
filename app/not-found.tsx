import Link from "next/link";

const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_MAIN_SITE_URL ??
  "https://wartournaments.com/racquet-war/";

const MAIN_SITE_LABEL = new URL(MAIN_SITE_URL).hostname.replace(/^www\./, "");

/**
 * Styled inline rather than with a stylesheet: ctd.css is scoped to the
 * tournament-director route and is not guaranteed to be loaded here.
 */
export default function NotFound() {
  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#55655f",
        }}
      >
        Page not found
      </p>
      <h1 style={{ margin: 0, fontSize: 32, color: "#00513f" }}>
        We could not find that page.
      </h1>
      <p style={{ margin: 0, maxWidth: 460, color: "#55655f" }}>
        This site hosts the Racquet War Certified Tournament Director
        application.
      </p>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}
      >
        <Link
          href="/tournament-director"
          style={{
            borderRadius: 999,
            background: "#006d56",
            padding: "12px 22px",
            fontWeight: 600,
            color: "#ffffff",
            textDecoration: "none",
          }}
        >
          Go to the application
        </Link>
        <a
          href={MAIN_SITE_URL}
          style={{
            borderRadius: 999,
            border: "1px solid #d7e3dd",
            background: "#ffffff",
            padding: "12px 22px",
            fontWeight: 600,
            color: "#10181a",
            textDecoration: "none",
          }}
        >
          Back to {MAIN_SITE_LABEL}
        </a>
      </div>
    </main>
  );
}
