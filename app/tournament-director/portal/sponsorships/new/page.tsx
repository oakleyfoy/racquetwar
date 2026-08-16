import { redirect } from "next/navigation";

import { requireDirectorSession } from "@/lib/ctd/director-guard";
import { createSponsorshipDraft } from "@/lib/ctd/portal-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewSponsorshipPage() {
  const director = await requireDirectorSession();
  const id = await createSponsorshipDraft(director.id);
  redirect(`/tournament-director/portal/sponsorships/${id}`);
}
