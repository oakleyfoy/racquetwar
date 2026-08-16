import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE, verifySessionToken } from "@/lib/ctd/admin-session";
import { getPortalFile, UUID_PATTERN } from "@/lib/ctd/portal-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const file = await getPortalFile(id);
  if (!file) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Disposition": `attachment; filename="${file.original_name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
