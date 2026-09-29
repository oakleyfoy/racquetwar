import { escapeHtml } from "./html";
import { getStaffNotifyAddress, sendCandidateMessage } from "./mail";
import { recordPortalActivity } from "./portal-db";
import {
  APP_URL,
  BRAND_NAME,
  CONTACT_EMAIL,
  CONTACT_NAME,
  OPERATOR_NAME,
} from "./site";

export const PORTAL_MAIL_TYPES = [
  "event_submitted",
  "event_needs_information",
  "event_authorized",
  "event_declined",
  "sponsorship_submitted",
  "sponsorship_needs_information",
  "sponsorship_approved",
  "sponsorship_approved_with_conditions",
  "sponsorship_declined",
] as const;

export type PortalMailType = (typeof PORTAL_MAIL_TYPES)[number];

const SIGNATURE = `${OPERATOR_NAME} | ${BRAND_NAME}`;

function wrap(title: string, body: string) {
  return {
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#10181a;line-height:1.7;max-width:640px;">
        <h2 style="margin:0 0 16px;color:#006d56;">${escapeHtml(title)}</h2>
        ${body}
        <p style="margin:24px 0 0;font-weight:700;color:#006d56;">${escapeHtml(SIGNATURE)}</p>
      </div>`,
    text: `${title}\n\n${body.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n")}\n\n${SIGNATURE}`,
  };
}

export function buildPortalEmail(
  type: PortalMailType,
  input: { firstName: string; title: string; detail?: string },
) {
  const name = escapeHtml(input.firstName || "there");
  const title = escapeHtml(input.title);
  const detail = input.detail ? escapeHtml(input.detail) : "";

  switch (type) {
    case "event_submitted":
      return {
        subject: "We received your event proposal",
        ...wrap(
          "Event proposal received",
          `<p>Hi ${name},</p><p>War Tournaments LLC received your proposal for <strong>${title}</strong>. This submission does not authorize you to announce or operate the event.</p>`,
        ),
      };
    case "event_needs_information":
      return {
        subject: "More information needed on your event proposal",
        ...wrap(
          "More information needed",
          `<p>Hi ${name},</p><p>Please add the requested information for <strong>${title}</strong> and resubmit.</p>${detail ? `<p>${detail}</p>` : ""}`,
        ),
      };
    case "event_authorized":
      return {
        subject: "Your event has been authorized",
        ...wrap(
          "Event authorized",
          `<p>Hi ${name},</p><p>War Tournaments LLC has authorized <strong>${title}</strong>. Only this authorization permits you to proceed under the written conditions.</p>${detail ? `<p>${detail}</p>` : ""}`,
        ),
      };
    case "event_declined":
      return {
        subject: "Update on your event proposal",
        ...wrap(
          "Event proposal update",
          `<p>Hi ${name},</p><p>After review, War Tournaments LLC is not authorizing <strong>${title}</strong> at this time.</p>`,
        ),
      };
    case "sponsorship_submitted":
      return {
        subject: "We received your sponsorship request",
        ...wrap(
          "Sponsorship request received",
          `<p>Hi ${name},</p><p>War Tournaments LLC received your sponsorship request for <strong>${title}</strong>. This does not approve sponsor benefits or use of RW marks.</p>`,
        ),
      };
    case "sponsorship_needs_information":
      return {
        subject: "More information needed on your sponsorship request",
        ...wrap(
          "More information needed",
          `<p>Hi ${name},</p><p>Please add the requested information for <strong>${title}</strong> and resubmit.</p>${detail ? `<p>${detail}</p>` : ""}`,
        ),
      };
    case "sponsorship_approved":
    case "sponsorship_approved_with_conditions":
      return {
        subject: "Your sponsorship request has been approved",
        ...wrap(
          type === "sponsorship_approved_with_conditions"
            ? "Sponsorship approved with conditions"
            : "Sponsorship approved",
          `<p>Hi ${name},</p><p>War Tournaments LLC approved the sponsorship request for <strong>${title}</strong>.</p>${detail ? `<p>${detail}</p>` : ""}`,
        ),
      };
    case "sponsorship_declined":
      return {
        subject: "Update on your sponsorship request",
        ...wrap(
          "Sponsorship request update",
          `<p>Hi ${name},</p><p>After review, War Tournaments LLC is not approving the sponsorship request for <strong>${title}</strong> at this time.</p>`,
        ),
      };
  }
}

export function buildStaffPortalAlert(input: {
  staffSubject: string;
  kind: "event" | "sponsorship";
  directorName: string;
  directorEmail: string;
  title: string;
  location?: string;
  reviewUrl: string;
}) {
  const kindLabel = input.kind === "event" ? "event proposal" : "sponsorship request";
  const locationLine = input.location?.trim()
    ? `<p><strong>Location:</strong> ${escapeHtml(input.location)}</p>`
    : "";
  const locationText = input.location?.trim()
    ? `Location: ${input.location}\n`
    : "";

  return {
    subject: input.staffSubject,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#10181a;line-height:1.7;max-width:640px;">
        <h2 style="margin:0 0 16px;color:#006d56;">New ${escapeHtml(kindLabel)} submitted</h2>
        <p>A Tournament Director submitted a ${escapeHtml(kindLabel)} for review.</p>
        <p><strong>Director:</strong> ${escapeHtml(input.directorName)} (${escapeHtml(input.directorEmail)})</p>
        <p><strong>${input.kind === "event" ? "Event" : "Sponsor"}:</strong> ${escapeHtml(input.title)}</p>
        ${locationLine}
        <p style="margin:24px 0;">
          <a href="${escapeHtml(input.reviewUrl)}" style="display:inline-block;background:#006d56;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">Review in admin</a>
        </p>
        <p style="margin:24px 0 0;font-weight:700;color:#006d56;">${escapeHtml(OPERATOR_NAME)} | ${escapeHtml(BRAND_NAME)}</p>
      </div>`,
    text: [
      `New ${kindLabel} submitted`,
      "",
      `A Tournament Director submitted a ${kindLabel} for review.`,
      "",
      `Director: ${input.directorName} (${input.directorEmail})`,
      `${input.kind === "event" ? "Event" : "Sponsor"}: ${input.title}`,
      locationText.trimEnd(),
      "",
      `Review: ${input.reviewUrl}`,
      "",
      `${OPERATOR_NAME} | ${BRAND_NAME}`,
    ]
      .filter((line) => line !== "")
      .join("\n"),
  };
}

export function portalReviewUrl(
  kind: "event" | "sponsorship",
  entityId: string,
) {
  const segment = kind === "event" ? "events" : "sponsorships";
  return `${APP_URL}/tournament-director/admin/${segment}/${entityId}`;
}

export function portalEmailHasForbiddenContent(
  rendered: { subject: string; html: string; text: string },
  internalNote?: string,
) {
  const bodies = [rendered.subject, rendered.html, rendered.text];
  return (
    bodies.some((body) =>
      ["{escapeHtml(", "${escapeHtml(", "PROGRAM_NAME", "undefined", "[object Object]"].some(
        (token) => body.includes(token),
      ),
    ) || Boolean(internalNote && bodies.some((body) => body.includes(internalNote)))
  );
}

export async function notifyPortal(
  type: PortalMailType,
  input: {
    directorEmail: string;
    firstName: string;
    title: string;
    detail?: string;
    entityType: "event" | "sponsorship";
    entityId: string;
    staffSubject: string;
    directorName?: string;
    location?: string;
    reviewUrl?: string;
  },
) {
  const directorMail = buildPortalEmail(type, input);
  const reviewUrl = input.reviewUrl || portalReviewUrl(input.entityType, input.entityId);
  const staff = type.endsWith("_submitted")
    ? buildStaffPortalAlert({
        staffSubject: input.staffSubject,
        kind: input.entityType,
        directorName: input.directorName || input.firstName,
        directorEmail: input.directorEmail,
        title: input.title,
        location: input.location,
        reviewUrl,
      })
    : {
        subject: input.staffSubject,
        html: directorMail.html,
        text: directorMail.text,
      };

  try {
    await sendCandidateMessage({
      to: input.directorEmail,
      ...directorMail,
    });
    await recordPortalActivity({
      entityType: input.entityType,
      entityId: input.entityId,
      activityType: "email_sent",
      newValue: type,
      description: `Sent ${type.replaceAll("_", " ")} email.`,
      createdBy: CONTACT_NAME,
    });
  } catch (error) {
    console.error("CTD portal director email failed", error);
    await recordPortalActivity({
      entityType: input.entityType,
      entityId: input.entityId,
      activityType: "email_failed",
      newValue: type,
      description: "Director notification failed.",
      createdBy: CONTACT_NAME,
    });
  }

  try {
    const staffTo = getStaffNotifyAddress();
    if (!staffTo) {
      console.error(
        "CTD portal staff email skipped because CTD_TO_EMAIL is not configured.",
      );
      return;
    }
    await sendCandidateMessage({
      to: staffTo,
      replyTo: input.directorEmail,
      ...staff,
    });
  } catch (error) {
    console.error("CTD portal staff email failed", error);
  }
}

export function directorLoginEmail(firstName: string, url: string) {
  return {
    subject: "Your RW Tournament Director portal sign-in link",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#10181a;line-height:1.7;max-width:640px;">
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>Use the button below to sign in to the Tournament Director portal. This link expires and can be used once.</p>
        <p><a href="${escapeHtml(url)}" style="display:inline-block;background:#006d56;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">Sign in</a></p>
        <p>If you did not request this, you can ignore the message.</p>
        <p style="font-weight:700;color:#006d56;">${escapeHtml(SIGNATURE)}</p>
        <p>${escapeHtml(CONTACT_EMAIL)}</p>
      </div>`,
    text: [
      `Hi ${firstName},`,
      "",
      "Use this one-time link to sign in to the Tournament Director portal:",
      url,
      "",
      "If you did not request this, you can ignore the message.",
      "",
      SIGNATURE,
    ].join("\n"),
  };
}
