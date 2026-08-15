import type { CtdApplicationInput } from "./fields";
import { escapeHtml, escapeHtmlMultiline } from "./html";
import {
  BRAND_NAME,
  CONTACT_EMAIL,
  CONTACT_NAME,
  CONTACT_PHONE,
  CONTACT_TITLE,
  OPERATOR_NAME,
  PROGRAM_NAME,
} from "./site";
import {
  ADMIN_TIMEZONE,
  SCREENING_METHOD_LABELS,
  type ScreeningMethod,
} from "./workflow";
import { formatInstantInTimeZone } from "./workflow-time";

export const CANDIDATE_EMAIL_TYPES = [
  "screening_invitation",
  "screening_confirmation",
  "screening_reschedule",
  "screening_cancellation",
  "advancement",
  "hold",
  "decline",
  "selection",
] as const;

export type CandidateEmailType = (typeof CANDIDATE_EMAIL_TYPES)[number];

export type ScreeningEmailDetails = {
  scheduledAt: string;
  timeZone: string;
  method: ScreeningMethod;
  locationOrLink: string;
};

export type CandidateEmailContext = {
  application: Pick<
    CtdApplicationInput,
    "firstName" | "lastName" | "email" | "mobilePhone"
  >;
  screening?: ScreeningEmailDetails;
  bookingUrl?: string;
};

function candidateName(application: CandidateEmailContext["application"]) {
  return `${application.firstName} ${application.lastName}`.trim();
}

const SIGNATURE = `${OPERATOR_NAME} | ${BRAND_NAME}`;

const AUTHORIZATION_REMINDER = [
  "This message is not certification, does not grant territory, and does not authorize you to announce, market, register players for, collect money for, or operate a Racquet War event.",
  `Written authorization from ${OPERATOR_NAME} is still required.`,
  `The ${PROGRAM_NAME} is operated by ${OPERATOR_NAME}.`,
].join(" ");

function wrapHtml(title: string, body: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#10181a;line-height:1.7;max-width:640px;">
      <h2 style="margin:0 0 16px;color:#006d56;">${escapeHtml(title)}</h2>
      ${body}
      <p style="margin:24px 0 0;font-weight:700;color:#006d56;">${escapeHtml(SIGNATURE)}</p>
    </div>`;
}

function contactBlockHtml() {
  return `
    <p style="margin:0 0 16px;">
      Questions? Reply to this email or write ${escapeHtml(CONTACT_EMAIL)}.
      Your reply will reach ${escapeHtml(CONTACT_NAME)}.
      You can also call ${escapeHtml(CONTACT_PHONE)}.
    </p>`;
}

function contactBlockText() {
  return [
    `Questions? Reply to this email or write ${CONTACT_EMAIL}.`,
    `Your reply will reach ${CONTACT_NAME}.`,
    `You can also call ${CONTACT_PHONE}.`,
  ].join("\n");
}

function screeningDetailsHtml(
  application: CandidateEmailContext["application"],
  details: ScreeningEmailDetails,
) {
  const candidateLocal = formatInstantInTimeZone(
    details.scheduledAt,
    details.timeZone,
  );
  const chicagoLocal = formatInstantInTimeZone(
    details.scheduledAt,
    ADMIN_TIMEZONE,
  );

  return `
    <div style="margin:20px 0;padding:16px;border:1px solid #dbe7e1;background:#f2f7f3;">
      <p style="margin:0 0 8px;font-weight:700;">Call details</p>
      <p style="margin:0;">Name: ${escapeHtml(candidateName(application))}</p>
      <p style="margin:0;">Date and time (${escapeHtml(details.timeZone)}): ${escapeHtml(candidateLocal)}</p>
      <p style="margin:0;">Administrator time (${escapeHtml(ADMIN_TIMEZONE)}): ${escapeHtml(chicagoLocal)}</p>
      <p style="margin:0;">Method: ${escapeHtml(SCREENING_METHOD_LABELS[details.method])}</p>
      <p style="margin:0;">Meeting link or instructions: ${escapeHtmlMultiline(details.locationOrLink || "We will confirm these details shortly.")}</p>
    </div>`;
}

function screeningDetailsText(
  application: CandidateEmailContext["application"],
  details: ScreeningEmailDetails,
) {
  return [
    "Call details",
    `Name: ${candidateName(application)}`,
    `Date and time (${details.timeZone}): ${formatInstantInTimeZone(details.scheduledAt, details.timeZone)}`,
    `Administrator time (${ADMIN_TIMEZONE}): ${formatInstantInTimeZone(details.scheduledAt, ADMIN_TIMEZONE)}`,
    `Method: ${SCREENING_METHOD_LABELS[details.method]}`,
    `Meeting link or instructions: ${details.locationOrLink || "We will confirm these details shortly."}`,
  ].join("\n");
}

function requireScreening(context: CandidateEmailContext) {
  if (!context.screening) {
    throw new Error("Screening details are required for this email.");
  }
  return context.screening;
}

export function isCandidateEmailType(
  value: string,
): value is CandidateEmailType {
  return (CANDIDATE_EMAIL_TYPES as readonly string[]).includes(value);
}

export function buildCandidateEmail(
  type: CandidateEmailType,
  context: CandidateEmailContext,
) {
  const firstName = context.application.firstName.trim() || "there";
  const program = PROGRAM_NAME;

  switch (type) {
    case "screening_invitation": {
      const bookingUrl = context.bookingUrl?.trim();
      if (!bookingUrl) {
        throw new Error("A Microsoft Bookings URL is required for the screening invitation.");
      }

      const safeUrl = escapeHtml(bookingUrl);
      return {
        subject: "Schedule Your RW Tournament Director Screening Call",
        html: `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#10181a;line-height:1.7;max-width:640px;">
      <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 16px;">
        Thank you for your interest in the ${escapeHtml(program)}.
      </p>
      <p style="margin:0 0 16px;">
        ${escapeHtml(CONTACT_NAME)} has reviewed your application and would like to invite you to an initial 30-minute screening call.
      </p>
      <p style="margin:0 0 16px;">
        Use the button below to choose an available date and time. The scheduling page will display appointment times in your local timezone and send your calendar invitation and meeting details after you book.
      </p>
      <p style="margin:24px 0;">
        <a href="${safeUrl}" style="display:inline-block;background:#006d56;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.06em;padding:14px 22px;border-radius:999px;">CHOOSE YOUR SCREENING TIME</a>
      </p>
      <p style="margin:0 0 16px;">
        This screening invitation does not constitute acceptance, certification, territory approval or authorization to operate a Racquet War event.
      </p>
      <p style="margin:0 0 16px;">
        If you have questions or experience a scheduling problem, reply to this email.
      </p>
      <p style="margin:24px 0 0;line-height:1.6;">
        ${escapeHtml(CONTACT_NAME)}<br>
        ${escapeHtml(CONTACT_TITLE)}<br>
        ${escapeHtml(SIGNATURE)}<br>
        ${escapeHtml(CONTACT_EMAIL)}<br>
        ${escapeHtml(CONTACT_PHONE)}
      </p>
    </div>`,
        text: [
          `Hi ${firstName},`,
          "",
          `Thank you for your interest in the ${program}.`,
          "",
          `${CONTACT_NAME} has reviewed your application and would like to invite you to an initial 30-minute screening call.`,
          "",
          "Use the button below to choose an available date and time. The scheduling page will display appointment times in your local timezone and send your calendar invitation and meeting details after you book.",
          "",
          "CHOOSE YOUR SCREENING TIME",
          bookingUrl,
          "",
          "This screening invitation does not constitute acceptance, certification, territory approval or authorization to operate a Racquet War event.",
          "",
          "If you have questions or experience a scheduling problem, reply to this email.",
          "",
          CONTACT_NAME,
          CONTACT_TITLE,
          SIGNATURE,
          CONTACT_EMAIL,
          CONTACT_PHONE,
        ].join("\n"),
      };
    }

    case "screening_confirmation": {
      const screening = requireScreening(context);
      return {
        subject: "Your RW Tournament Director Screening Call Is Scheduled",
        html: wrapHtml(
          "Your screening call is scheduled",
          `
            <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 16px;">
              This confirms your screening call for the ${escapeHtml(program)} operated by ${escapeHtml(OPERATOR_NAME)}.
            </p>
            ${screeningDetailsHtml(context.application, screening)}
            ${contactBlockHtml()}
          `,
        ),
        text: [
          `Hi ${firstName},`,
          "",
          `This confirms your screening call for the ${program} operated by ${OPERATOR_NAME}.`,
          "",
          screeningDetailsText(context.application, screening),
          "",
          contactBlockText(),
          "",
          SIGNATURE,
        ].join("\n"),
      };
    }

    case "screening_reschedule": {
      const screening = requireScreening(context);
      return {
        subject: "Updated RW Tournament Director Screening Call",
        html: wrapHtml(
          "Your screening call has been updated",
          `
            <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 16px;">
              Your screening call for the ${escapeHtml(program)} has been rescheduled. The updated details are below.
            </p>
            ${screeningDetailsHtml(context.application, screening)}
            ${contactBlockHtml()}
          `,
        ),
        text: [
          `Hi ${firstName},`,
          "",
          `Your screening call for the ${program} has been rescheduled. The updated details are below.`,
          "",
          screeningDetailsText(context.application, screening),
          "",
          contactBlockText(),
          "",
          SIGNATURE,
        ].join("\n"),
      };
    }

    case "screening_cancellation":
      return {
        subject: "Update Regarding Your RW Tournament Director Screening Call",
        html: wrapHtml(
          "Update regarding your screening call",
          `
            <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 16px;">
              We need to cancel the screening call that was arranged for your ${escapeHtml(program)} application.
              This is a scheduling update only and does not change the status of your application on its own.
            </p>
            <p style="margin:0 0 16px;">
              If you have questions or would like to arrange another time, reply to this email.
            </p>
            ${contactBlockHtml()}
          `,
        ),
        text: [
          `Hi ${firstName},`,
          "",
          `We need to cancel the screening call that was arranged for your ${program} application.`,
          "This is a scheduling update only and does not change the status of your application on its own.",
          "",
          "If you have questions or would like to arrange another time, reply to this email.",
          "",
          contactBlockText(),
          "",
          SIGNATURE,
        ].join("\n"),
      };

    case "advancement":
      return {
        subject: `${program} — Next Step`,
        html: wrapHtml(
          "Next step in your application",
          `
            <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 16px;">
              Thank you for the conversation. ${escapeHtml(CONTACT_NAME)} is advancing your application
              in the ${escapeHtml(program)} for further internal review.
            </p>
            <p style="margin:0 0 16px;">${escapeHtml(AUTHORIZATION_REMINDER)}</p>
            ${contactBlockHtml()}
          `,
        ),
        text: [
          `Hi ${firstName},`,
          "",
          `Thank you for the conversation. ${CONTACT_NAME} is advancing your application in the ${program} for further internal review.`,
          "",
          AUTHORIZATION_REMINDER,
          "",
          contactBlockText(),
          "",
          SIGNATURE,
        ].join("\n"),
      };

    case "hold":
      return {
        subject: `${program} — Application Update`,
        html: wrapHtml(
          "Application update",
          `
            <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 16px;">
              Thank you for your interest in the ${escapeHtml(program)}.
              Your application remains under consideration, and we will follow up when there is a next step.
            </p>
            <p style="margin:0 0 16px;">${escapeHtml(AUTHORIZATION_REMINDER)}</p>
            ${contactBlockHtml()}
          `,
        ),
        text: [
          `Hi ${firstName},`,
          "",
          `Thank you for your interest in the ${program}. Your application remains under consideration, and we will follow up when there is a next step.`,
          "",
          AUTHORIZATION_REMINDER,
          "",
          contactBlockText(),
          "",
          SIGNATURE,
        ].join("\n"),
      };

    case "decline":
      return {
        subject: `${program} — Application Update`,
        html: wrapHtml(
          "Application update",
          `
            <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 16px;">
              Thank you for applying to the ${escapeHtml(program)} operated by ${escapeHtml(OPERATOR_NAME)}
              and for the time you invested in the process. After review, we are not moving your
              application forward at this time.
            </p>
            <p style="margin:0 0 16px;">${escapeHtml(AUTHORIZATION_REMINDER)}</p>
            ${contactBlockHtml()}
          `,
        ),
        text: [
          `Hi ${firstName},`,
          "",
          `Thank you for applying to the ${program} operated by ${OPERATOR_NAME} and for the time you invested in the process. After review, we are not moving your application forward at this time.`,
          "",
          AUTHORIZATION_REMINDER,
          "",
          contactBlockText(),
          "",
          SIGNATURE,
        ].join("\n"),
      };

    case "selection":
      return {
        subject: `${program} — Internal Selection Update`,
        html: wrapHtml(
          "Internal selection update",
          `
            <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 16px;">
              ${escapeHtml(CONTACT_NAME)} has recorded an internal selection status for your application
              to the ${escapeHtml(program)}. This is an internal recruiting status only.
            </p>
            <p style="margin:0 0 16px;">${escapeHtml(AUTHORIZATION_REMINDER)}</p>
            ${contactBlockHtml()}
          `,
        ),
        text: [
          `Hi ${firstName},`,
          "",
          `${CONTACT_NAME} has recorded an internal selection status for your application to the ${program}. This is an internal recruiting status only.`,
          "",
          AUTHORIZATION_REMINDER,
          "",
          contactBlockText(),
          "",
          SIGNATURE,
        ].join("\n"),
      };
  }
}

export function candidateEmailContainsForbiddenContent(
  rendered: { subject: string; html: string; text: string },
  internalNote?: string,
) {
  const bodies = [rendered.subject, rendered.html, rendered.text];
  const forbidden = [
    "{escapeHtml(",
    "${escapeHtml(",
    "PROGRAM_NAME",
    "undefined",
    "[object Object]",
    "Internal — not visible to applicant",
  ];

  return (
    bodies.some((body) =>
      forbidden.some((token) => body.includes(token)),
    ) ||
    Boolean(internalNote && bodies.some((body) => body.includes(internalNote)))
  );
}
