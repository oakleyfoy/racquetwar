import { NextResponse } from "next/server";

import { describeMailConfig, sendTestEmail } from "@/lib/ctd/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only mail diagnostics. Access is enforced by proxy.ts, which covers
 * /tournament-director/api/admin/*.
 *
 * GET                     reports the transport and which variables are set
 * GET ?send=1             sends a test message to CTD_TO_EMAIL
 * GET ?send=1&to=<email>  sends it somewhere else instead
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const config = describeMailConfig();

  if (url.searchParams.get("send") !== "1") {
    return NextResponse.json({ config });
  }

  try {
    const result = await sendTestEmail(url.searchParams.get("to") ?? undefined);
    return NextResponse.json({ config, sent: true, ...result });
  } catch (error) {
    console.error("CTD mail test failed", error);
    return NextResponse.json(
      {
        config,
        sent: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
