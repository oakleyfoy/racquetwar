import type { MetadataRoute } from "next";

/**
 * Indexing is blocked unless explicitly enabled. That default dates from when
 * this app also served a half-built clone of the main site, which had no
 * business appearing in search.
 *
 * It now serves only the application form, so enabling indexing is a reasonable
 * choice if the form should be discoverable. The admin area and the API stay
 * excluded either way.
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
