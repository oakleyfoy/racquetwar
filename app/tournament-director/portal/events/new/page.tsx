import { requireDirectorSession } from "@/lib/ctd/director-guard";
import { createEventDraft } from "@/lib/ctd/portal-db";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewEventProposalPage() {
  const director = await requireDirectorSession();
  const id = await createEventDraft(director);
  redirect(`/tournament-director/portal/events/${id}`);
}
