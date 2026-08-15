/**
 * Shared public-site constants for the application and program pages.
 * Marketing copy lives here so both routes and the copy tests stay aligned.
 */

export const APPLICATION_PATH = "/tournament-director";
export const PROGRAM_PATH = "/tournament-director-program";
export const PROGRAM_SUPPORT_ID = "program-support";

export const PROGRAM_NAME = "RW Certified Tournament Director Program";

export const OPERATOR_NAME = "War Tournaments LLC";
export const BRAND_NAME = "Racquet War";

export const CONTACT_NAME = "Oakley Foy";
export const CONTACT_TITLE = "CEO & Co-Founder";
export const CONTACT_EMAIL = "Oakley@WarGroupLLC.com";
export const CONTACT_PHONE = "(901) 359-3035";
export const CONTACT_PHONE_TEL = "+19013593035";

export const APP_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://apply.wartournaments.com"
).replace(/\/+$/, "");

/**
 * Where the logo and the back button lead. Deliberately separate from APP_URL:
 * Racquet War events are run by War Tournaments now, and racquetwar.com only
 * serves a notice saying so, which is a dead end mid-application.
 */
export const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_MAIN_SITE_URL ??
  "https://wartournaments.com/racquet-war/";

/** Derived so the button text cannot drift from where it actually points. */
export const MAIN_SITE_LABEL = new URL(MAIN_SITE_URL).hostname.replace(
  /^www\./,
  "",
);

export const APPLICATION_EYEBROW = PROGRAM_NAME;

export const APPLICATION_HERO_BADGES = [
  "Initial group of 5–8 candidates",
  "Potential ZIP-code territory after certification",
  "Takes about 10 minutes",
] as const;

export const APPLICATION_SEO = {
  title: "Apply | RW Certified Tournament Director Program",
  description:
    "Apply for consideration for the RW Certified Tournament Director Program operated by War Tournaments LLC.",
} as const;

export const PROGRAM_SEO = {
  title: "RW Certified Tournament Director Program | War Tournaments",
  description:
    "Learn how to become an RW Certified Tournament Director and develop professionally supported Racquet War events in your local market.",
} as const;

export const APPLICATION_PRIVACY_COPY =
  "Fields marked with an asterisk are required. Your information is submitted directly to War Tournaments LLC and will be used to evaluate your interest in the RW Certified Tournament Director Program. Your information will not be sold. This form is protected by reCAPTCHA, and the Google Privacy Policy and Terms of Service apply.";

export const GOOGLE_PRIVACY_URL = "https://policies.google.com/privacy";
export const GOOGLE_TERMS_URL = "https://policies.google.com/terms";
