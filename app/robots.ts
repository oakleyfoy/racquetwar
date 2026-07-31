import type { MetadataRoute } from "next";

/**
 * While WordPress still serves racquetwar.com, this app is reachable only at its
 * raw Render hostname and through the Cloudflare rule for /tournament-director.
 * Crawlers should not index the Render hostname directly, so indexing is blocked
 * until it is explicitly enabled.
 *
 * IMPORTANT: set ALLOW_SEARCH_INDEXING=true when this app takes over the full
 * racquetwar.com domain, otherwise the entire site will stay out of search.
 *
 * Note that /robots.txt is not proxied by Cloudflare, so this file only affects
 * the Render hostname and never overrides the live WordPress robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.ALLOW_SEARCH_INDEXING === "true";

  if (!allowIndexing) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/tournament-director/admin", "/tournament-director/api/"],
      },
    ],
  };
}
