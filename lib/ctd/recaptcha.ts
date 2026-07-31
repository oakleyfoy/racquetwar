import { RECAPTCHA_ACTION } from "./fields";

export { RECAPTCHA_ACTION };

const DEFAULT_MIN_SCORE = 0.5;

export type RecaptchaResult = { ok: true } | { ok: false; error: string };

function minScore() {
  const parsed = Number(process.env.RECAPTCHA_MIN_SCORE ?? DEFAULT_MIN_SCORE);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return DEFAULT_MIN_SCORE;
  }
  return parsed;
}

/**
 * Verifies a reCAPTCHA v3 token. When no secret is configured the check is
 * skipped in development but treated as a hard failure in production, so the
 * form can never quietly ship without spam protection.
 */
export async function verifyRecaptcha(
  token: string,
  remoteIp?: string,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        error: "Spam protection is not configured. Please contact us directly.",
      };
    }
    return { ok: true };
  }

  if (!token) {
    return {
      ok: false,
      error: "Please refresh the page and try again so we can verify your submission.",
    };
  }

  let data: {
    success?: boolean;
    score?: number;
    action?: string;
    "error-codes"?: string[];
  };

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
          ...(remoteIp ? { remoteip: remoteIp } : {}),
        }),
      },
    );

    if (!response.ok) throw new Error(`status ${response.status}`);
    data = await response.json();
  } catch (error) {
    console.error("CTD reCAPTCHA verification request failed", error);
    return {
      ok: false,
      error: "We could not verify your submission. Please try again shortly.",
    };
  }

  if (!data.success) {
    console.warn("CTD reCAPTCHA rejected", data["error-codes"]);
    return { ok: false, error: "Security verification failed. Please try again." };
  }

  if (data.action && data.action !== RECAPTCHA_ACTION) {
    return {
      ok: false,
      error: "Security verification did not match this form. Please try again.",
    };
  }

  if (typeof data.score === "number" && data.score < minScore()) {
    return {
      ok: false,
      error:
        "Your submission was flagged as automated traffic. Please try again or email us directly.",
    };
  }

  return { ok: true };
}

export function getRecaptchaSiteKey() {
  return process.env.RECAPTCHA_SITE_KEY ?? "";
}
