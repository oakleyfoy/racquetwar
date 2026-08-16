"use server";

import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/ctd/admin-guard";
import {
  activateDirectorFromApplication,
  directorDisplayName,
  getDirector,
  issueDirectorLoginLink,
  setDirectorActive,
} from "@/lib/ctd/director-db";
import { sendCandidateMessage } from "@/lib/ctd/mail";
import {
  addPortalMessage,
  addPortalNote,
  adminSetEventStatus,
  adminSetSponsorshipStatus,
  approveSponsorship,
  authorizeEventProposal,
  getEventProposal,
  getSponsorship,
  UUID_PATTERN,
} from "@/lib/ctd/portal-db";
import { directorLoginEmail, notifyPortal } from "@/lib/ctd/portal-mail";
import {
  isEventStatus as checkEventStatus,
  isSponsorshipStatus as checkSponsorshipStatus,
} from "@/lib/ctd/portal-domain";
import { requireStoredApplication } from "@/lib/ctd/workflow-db";
import { WORKFLOW_ACTOR } from "@/lib/ctd/workflow";

const ADMIN = "/tournament-director/admin";

function workspace(path: string, notice?: string) {
  return notice ? `${ADMIN}${path}?notice=${notice}` : `${ADMIN}${path}`;
}

function fail(path: string, error: unknown) {
  const message = error instanceof Error ? error.message : "That request could not be completed.";
  return `${ADMIN}${path}?error=${encodeURIComponent(message.slice(0, 180))}`;
}

export async function activateDirectorAction(formData: FormData) {
  await requireAdminSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  if (!UUID_PATTERN.test(applicationId)) redirect(`${ADMIN}?error=notfound`);
  const application = await requireStoredApplication(applicationId);
  if (!application) redirect(`${ADMIN}?error=notfound`);
  try {
    await activateDirectorFromApplication({
      applicationId: application.id,
      email: application.email,
      firstName: application.firstName,
      lastName: application.lastName,
    });
  } catch (error) {
    redirect(fail(`/${applicationId}`, error));
  }
  redirect(workspace(`/${applicationId}`, "director_activated"));
}

export async function sendDirectorLoginAction(formData: FormData) {
  await requireAdminSession();
  const directorId = String(formData.get("directorId") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");
  const director = await getDirector(directorId);
  if (!director || director.status !== "active") {
    redirect(workspace(applicationId ? `/${applicationId}` : "/directors", "director_inactive"));
  }
  const issued = await issueDirectorLoginLink(director.email);
  if (!issued) {
    redirect(workspace(applicationId ? `/${applicationId}` : "/directors", "director_inactive"));
  }
  try {
    const mail = directorLoginEmail(issued.director.firstName, issued.url);
    await sendCandidateMessage({ to: issued.director.email, ...mail });
  } catch (error) {
    console.error("CTD director login email failed", error);
    redirect(workspace(applicationId ? `/${applicationId}` : "/directors", "email_failed"));
  }
  redirect(workspace(applicationId ? `/${applicationId}` : "/directors", "director_link_sent"));
}

export async function setDirectorActiveAction(formData: FormData) {
  await requireAdminSession();
  const directorId = String(formData.get("directorId") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  if (!UUID_PATTERN.test(directorId)) redirect(`${ADMIN}/directors`);
  await setDirectorActive(directorId, active);
  redirect(workspace("/directors", active ? "director_activated" : "director_deactivated"));
}

export async function adminEventStatusAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const message = String(formData.get("directorMessage") ?? "");
  if (!UUID_PATTERN.test(id) || !checkEventStatus(status)) {
    redirect(`${ADMIN}/events`);
  }
  if (status === "authorized") {
    redirect(fail(`/events/${id}`, new Error("Use the authorization controls to authorize an event.")));
  }
  try {
    const proposal = await adminSetEventStatus(id, status, WORKFLOW_ACTOR, message);
    if (message.trim() && proposal) {
      await addPortalMessage("event", id, proposal.directorId, message, WORKFLOW_ACTOR);
    }
    if (proposal && (status === "needs_information" || status === "declined")) {
      const director = await getDirector(proposal.directorId);
      if (director) {
        void notifyPortal(status === "declined" ? "event_declined" : "event_needs_information", {
          directorEmail: director.email,
          firstName: director.firstName,
          title: proposal.eventName || "Event proposal",
          detail: message,
          entityType: "event",
          entityId: id,
          staffSubject: `Event proposal ${status.replaceAll("_", " ")} — ${directorDisplayName(director)}`,
        }).catch((error) => console.error("CTD portal notify failed", error));
      }
    }
  } catch (error) {
    redirect(fail(`/events/${id}`, error));
  }
  redirect(workspace(`/events/${id}`, "saved"));
}

export async function authorizeEventAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect(`${ADMIN}/events`);
  try {
    const authorization = await authorizeEventProposal(id, {
      specialConditions: String(formData.get("specialConditions") ?? ""),
    });
    const proposal = await getEventProposal(id);
    if (proposal) {
      const director = await getDirector(proposal.directorId);
      if (director) {
        void notifyPortal("event_authorized", {
          directorEmail: director.email,
          firstName: director.firstName,
          title: authorization?.eventName || proposal.eventName,
          detail: authorization?.specialConditions,
          entityType: "event",
          entityId: id,
          staffSubject: `Event authorized — ${directorDisplayName(director)}`,
        }).catch((error) => console.error("CTD portal notify failed", error));
      }
    }
  } catch (error) {
    redirect(fail(`/events/${id}`, error));
  }
  redirect(workspace(`/events/${id}`, "authorized"));
}

export async function adminSponsorshipStatusAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const message = String(formData.get("directorMessage") ?? "");
  if (!UUID_PATTERN.test(id) || !checkSponsorshipStatus(status)) {
    redirect(`${ADMIN}/sponsorships`);
  }
  if (status === "approved" || status === "approved_with_conditions") {
    redirect(fail(`/sponsorships/${id}`, new Error("Use the approval controls to approve a sponsorship.")));
  }
  try {
    const request = await adminSetSponsorshipStatus(id, status, WORKFLOW_ACTOR, message);
    if (message.trim() && request) {
      await addPortalMessage("sponsorship", id, request.directorId, message, WORKFLOW_ACTOR);
    }
    if (request && (status === "needs_information" || status === "declined")) {
      const director = await getDirector(request.directorId);
      if (director) {
        void notifyPortal(
          status === "declined" ? "sponsorship_declined" : "sponsorship_needs_information",
          {
            directorEmail: director.email,
            firstName: director.firstName,
            title: request.sponsorName || "Sponsorship request",
            detail: message,
            entityType: "sponsorship",
            entityId: id,
            staffSubject: `Sponsorship ${status.replaceAll("_", " ")} — ${directorDisplayName(director)}`,
          },
        ).catch((error) => console.error("CTD portal notify failed", error));
      }
    }
  } catch (error) {
    redirect(fail(`/sponsorships/${id}`, error));
  }
  redirect(workspace(`/sponsorships/${id}`, "saved"));
}

export async function approveSponsorshipAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect(`${ADMIN}/sponsorships`);
  const withConditions = String(formData.get("withConditions") ?? "") === "1";
  try {
    const approval = await approveSponsorship(id, {
      approvedCash: String(formData.get("approvedCash") ?? ""),
      approvedNoncash: String(formData.get("approvedNoncash") ?? ""),
      approvedBenefits: String(formData.get("approvedBenefits") ?? ""),
      approvedPeriod: String(formData.get("approvedPeriod") ?? ""),
      categoryRestrictions: String(formData.get("categoryRestrictions") ?? ""),
      noncashTreatment: String(formData.get("noncashTreatment") ?? ""),
      conditions: String(formData.get("conditions") ?? ""),
      withConditions,
    });
    const request = await getSponsorship(id);
    if (request) {
      const director = await getDirector(request.directorId);
      if (director) {
        void notifyPortal(
          withConditions ? "sponsorship_approved_with_conditions" : "sponsorship_approved",
          {
            directorEmail: director.email,
            firstName: director.firstName,
            title: approval?.sponsor || request.sponsorName,
            detail: approval?.conditions,
            entityType: "sponsorship",
            entityId: id,
            staffSubject: `Sponsorship approved — ${directorDisplayName(director)}`,
          },
        ).catch((error) => console.error("CTD portal notify failed", error));
      }
    }
  } catch (error) {
    redirect(fail(`/sponsorships/${id}`, error));
  }
  redirect(workspace(`/sponsorships/${id}`, "approved"));
}

export async function addPortalNoteAction(formData: FormData) {
  await requireAdminSession();
  const entityType = String(formData.get("entityType") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const note = String(formData.get("note") ?? "");
  const path = entityType === "sponsorship" ? `/sponsorships/${entityId}` : `/events/${entityId}`;
  try {
    await addPortalNote(entityType, entityId, note, WORKFLOW_ACTOR);
  } catch (error) {
    redirect(fail(path, error));
  }
  redirect(workspace(path, "note_added"));
}

export async function addPortalMessageAction(formData: FormData) {
  await requireAdminSession();
  const entityType = String(formData.get("entityType") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const directorId = String(formData.get("directorId") ?? "");
  const message = String(formData.get("message") ?? "");
  const path = entityType === "sponsorship" ? `/sponsorships/${entityId}` : `/events/${entityId}`;
  try {
    await addPortalMessage(entityType, entityId, directorId, message, WORKFLOW_ACTOR);
  } catch (error) {
    redirect(fail(path, error));
  }
  redirect(workspace(path, "message_sent"));
}
