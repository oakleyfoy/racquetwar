import { listApplications, toCsv } from "@/lib/ctd/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const records = await listApplications({
      status: url.searchParams.get("status") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
    });

    const filename = `ctd-applications-${new Date().toISOString().slice(0, 10)}.csv`;

    // The BOM makes Excel open the file as UTF-8 instead of mangling accents.
    return new Response(`\uFEFF${toCsv(records)}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("CTD CSV export failed", error);
    return new Response("Unable to build the export.", { status: 500 });
  }
}
