import { NextResponse } from "next/server";

import { insertApplication } from "@/lib/ctd/applications";
import { isDatabaseConfigured } from "@/lib/ctd/db";
import { dispatchApplicationEmails, isMailConfigured } from "@/lib/ctd/mail";
import { verifyRecaptcha } from "@/lib/ctd/recaptcha";
import { validateApplication } from "@/lib/ctd/validate";

// The Postgres driver needs the Node runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const globalForRateLimit = globalThis as unknown as {
  ctdSubmitHits?: Map<string, number[]>;
};

const hits: Map<string, number[]> = (globalForRateLimit.ctdSubmitHits ??=
  new Map<string, number[]>());

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("cf-connecting-ip") ?? "";
}

/**
 * Best-effort throttle. It is per-instance rather than global, which is enough
 * to blunt naive scripted abuse without adding external infrastructure.
 */
function isRateLimited(ip: string) {
  if (!ip) return false;

  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [key, timestamps] of hits) {
      if (timestamps.every((timestamp) => now - timestamp >= RATE_LIMIT_WINDOW_MS)) {
        hits.delete(key);
      }
    }
  }

  return false;
}

async function hashIp(ip: string) {
  if (!ip) return "";

  const salt = process.env.ADMIN_SESSION_SECRET ?? "racquet-war-ctd";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}:${ip}`),
  );

  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "We could not read that submission. Please try again." },
      { status: 400 },
    );
  }

  const payload = (body ?? {}) as Record<string, unknown>;

  // Honeypot: bots fill hidden fields, so accept silently and discard.
  if (typeof payload.company === "string" && payload.company.trim()) {
    return NextResponse.json({ ok: true });
  }

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "You have submitted several applications recently. Please wait a few minutes and try again.",
      },
      { status: 429 },
    );
  }

  const validation = validateApplication(payload);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 },
    );
  }

  const recaptchaToken =
    typeof payload.recaptchaToken === "string" ? payload.recaptchaToken : "";
  const recaptcha = await verifyRecaptcha(recaptchaToken, ip);
  if (!recaptcha.ok) {
    return NextResponse.json(
      { ok: false, error: recaptcha.error },
      { status: 400 },
    );
  }

  const application = validation.value;

  let stored = false;
  if (isDatabaseConfigured()) {
    try {
      await insertApplication(application, {
        sourcePage: request.headers.get("referer") ?? "/tournament-director",
        ipHash: await hashIp(ip),
      });
      stored = true;
    } catch (error) {
      console.error("CTD application database insert failed", error);
    }
  }

  let emailed = false;
  if (isMailConfigured()) {
    try {
      const result = await dispatchApplicationEmails(application);
      emailed = result.mode !== "skipped";
    } catch (error) {
      console.error("CTD application email dispatch failed", error);
    }
  }

  // Only a total failure is reported to the applicant; one surviving path is enough.
  if (!stored && !emailed) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "CTD application received but neither DATABASE_URL nor mail credentials are configured.",
        application,
      );
      return NextResponse.json({
        ok: true,
        message:
          "Development mode: application logged to the server console because no database or mail transport is configured.",
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "We could not save your application. Please try again shortly, or email us directly so we do not lose your details.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Thank you. Your application has been received and a confirmation email is on its way.",
  });
}
