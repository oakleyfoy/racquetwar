import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { loadDirectorFromCookie } from "@/lib/ctd/director-db";
import { DIRECTOR_COOKIE } from "@/lib/ctd/director-session";
import { getPortalFile, UUID_PATTERN } from "@/lib/ctd/portal-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const token = (await cookies()).get(DIRECTOR_COOKIE)?.value;
  const director = await loadDirectorFromCookie(token);
  if (!director) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const file = await getPortalFile(id);
  if (!file || file.director_id !== director.id) {
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
