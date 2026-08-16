"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireDirectorSession } from "@/lib/ctd/director-guard";
import {
  consumeDirectorLoginToken,
  directorDisplayName,
  issueDirectorLoginLink,
} from "@/lib/ctd/director-db";
import {
  DIRECTOR_COOKIE,
  DIRECTOR_COOKIE_OPTIONS,
  DIRECTOR_LOGIN_PATH,
  DIRECTOR_PORTAL_PATH,
  verifyDirectorCookie,
} from "@/lib/ctd/director-session";
import { sendCandidateMessage } from "@/lib/ctd/mail";
import {
  copyEventProposal,
  createEventDraft,
  createSponsorshipDraft,
  parseEventForm,
  parseSponsorshipForm,
  saveEventDraft,
  savePortalFile,
  saveSponsorshipDraft,
  submitEventProposal,
  submitSponsorship,
  UUID_PATTERN,
  withdrawEventProposal,
  withdrawSponsorship,
} from "@/lib/ctd/portal-db";
import { directorLoginEmail, notifyPortal } from "@/lib/ctd/portal-mail";

function portalPath(path: string, notice?: string) {
  return notice
    ? `${DIRECTOR_PORTAL_PATH}${path}?notice=${notice}`
    : `${DIRECTOR_PORTAL_PATH}${path}`;
}

function errorRedirect(path: string, error: unknown) {
  const message = error instanceof Error ? error.message : "That request could not be completed.";
  const encoded = encodeURIComponent(message.slice(0, 180));
  return `${DIRECTOR_PORTAL_PATH}${path}${path.includes("?") ? "&" : "?"}error=${encoded}`;
}

export async function requestDirectorLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (email) {
    const issued = await issueDirectorLoginLink(email);
    if (issued) {
      try {
        const mail = directorLoginEmail(issued.director.firstName, issued.url);
        await sendCandidateMessage({
          to: issued.director.email,
          ...mail,
        });
      } catch (error) {
        console.error("CTD director login email failed", error);
      }
    }
  }
  redirect(`${DIRECTOR_LOGIN_PATH}?sent=1`);
}

export async function completeDirectorLoginAction(token: string) {
  const consumed = await consumeDirectorLoginToken(token);
  if (!consumed) {
    redirect(`${DIRECTOR_LOGIN_PATH}?error=invalid`);
  }
  const store = await cookies();
  store.set(DIRECTOR_COOKIE, consumed.cookie, DIRECTOR_COOKIE_OPTIONS);
  redirect(DIRECTOR_PORTAL_PATH);
}

export async function directorLogoutAction() {
  const store = await cookies();
  const token = store.get(DIRECTOR_COOKIE)?.value;
  const parsed = await verifyDirectorCookie(token);
  if (parsed) {
    const { revokeDirectorSession } = await import("@/lib/ctd/director-db");
    await revokeDirectorSession(parsed.sessionId);
  }
  store.delete({ name: DIRECTOR_COOKIE, path: DIRECTOR_COOKIE_OPTIONS.path });
  redirect(DIRECTOR_LOGIN_PATH);
}

export async function startEventProposalAction() {
  const director = await requireDirectorSession();
  const id = await createEventDraft(director);
  redirect(portalPath(`/events/${id}`));
}

export async function saveEventFormAction(formData: FormData) {
  const director = await requireDirectorSession();
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "draft");
  if (!UUID_PATTERN.test(id)) redirect(portalPath("/events"));
  try {
    await saveEventDraft(id, director.id, parseEventForm(formData));
    await savePortalFile({
      directorId: director.id,
      entityType: "event",
      entityId: id,
      file: formData.get("supportingFile") as File | null,
    });
    if (intent === "submit") {
      const submitted = await submitEventProposal(id, director.id);
      void notifyPortal("event_submitted", {
        directorEmail: director.email,
        firstName: director.firstName,
        title: submitted?.eventName || "Event proposal",
        entityType: "event",
        entityId: id,
        staffSubject: `Event proposal submitted by ${directorDisplayName(director)}`,
      }).catch((error) => console.error("CTD portal notify failed", error));
      redirect(portalPath(`/events/${id}`, "submitted"));
    }
  } catch (error) {
    redirect(errorRedirect(`/events/${id}`, error));
  }
  redirect(portalPath(`/events/${id}`, "saved"));
}

export async function withdrawEventProposalAction(formData: FormData) {
  const director = await requireDirectorSession();
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect(portalPath("/events"));
  try {
    await withdrawEventProposal(id, director.id);
  } catch (error) {
    redirect(errorRedirect(`/events/${id}`, error));
  }
  redirect(portalPath(`/events/${id}`, "withdrawn"));
}

export async function copyEventProposalAction(formData: FormData) {
  const director = await requireDirectorSession();
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect(portalPath("/events"));
  try {
    const draftId = await copyEventProposal(id, director.id);
    redirect(portalPath(`/events/${draftId}`, "copied"));
  } catch (error) {
    redirect(errorRedirect(`/events/${id}`, error));
  }
}

export async function startSponsorshipAction() {
  const director = await requireDirectorSession();
  const id = await createSponsorshipDraft(director.id);
  redirect(portalPath(`/sponsorships/${id}`));
}

export async function saveSponsorshipFormAction(formData: FormData) {
  const director = await requireDirectorSession();
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "draft");
  if (!UUID_PATTERN.test(id)) redirect(portalPath("/sponsorships"));
  try {
    await saveSponsorshipDraft(id, director.id, parseSponsorshipForm(formData));
    await savePortalFile({
      directorId: director.id,
      entityType: "sponsorship",
      entityId: id,
      file: formData.get("supportingFile") as File | null,
    });
    if (intent === "submit") {
      const submitted = await submitSponsorship(id, director.id);
      void notifyPortal("sponsorship_submitted", {
        directorEmail: director.email,
        firstName: director.firstName,
        title: submitted?.sponsorName || "Sponsorship request",
        entityType: "sponsorship",
        entityId: id,
        staffSubject: `Sponsorship request submitted by ${directorDisplayName(director)}`,
      }).catch((error) => console.error("CTD portal notify failed", error));
      redirect(portalPath(`/sponsorships/${id}`, "submitted"));
    }
  } catch (error) {
    redirect(errorRedirect(`/sponsorships/${id}`, error));
  }
  redirect(portalPath(`/sponsorships/${id}`, "saved"));
}

export async function withdrawSponsorshipAction(formData: FormData) {
  const director = await requireDirectorSession();
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect(portalPath("/sponsorships"));
  try {
    await withdrawSponsorship(id, director.id);
  } catch (error) {
    redirect(errorRedirect(`/sponsorships/${id}`, error));
  }
  redirect(portalPath(`/sponsorships/${id}`, "withdrawn"));
}

