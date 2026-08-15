import nodemailer from "nodemailer";

import { formatTerritory, type CtdApplicationInput } from "./fields";
import { CONTACT_EMAIL, PROGRAM_NAME } from "./site";
import { applicantName, buildReport, type ReportSection } from "./report";

type MicrosoftMailConfig = {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  from: string;
  to: string;
};

type SmtpMailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
};

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export type MailMode = "microsoft-graph" | "smtp" | "skipped";

/**
 * Values pasted into a hosting dashboard routinely pick up stray whitespace,
 * and none of these settings can legitimately contain any. A leading newline on
 * MAIL_FROM_EMAIL is enough to make Graph address a mailbox that does not
 * exist, so trim before use rather than trusting the environment.
 */
function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getSharedMailboxSettings() {
  const from = env("MAIL_FROM_EMAIL") ?? env("FORM_FROM_EMAIL");
  const to = env("CTD_TO_EMAIL") ?? env("INQUIRY_TO_EMAIL");

  if (!from || !to) return null;

  return { from, to };
}

function getMicrosoftMailConfig(): MicrosoftMailConfig | null {
  const shared = getSharedMailboxSettings();
  const clientId = env("MICROSOFT_CLIENT_ID");
  const clientSecret = env("MICROSOFT_CLIENT_SECRET");
  const tenantId = env("MICROSOFT_TENANT_ID");

  if (!shared || !clientId || !clientSecret || !tenantId) return null;

  return { clientId, clientSecret, tenantId, from: shared.from, to: shared.to };
}

function getSmtpMailConfig(): SmtpMailConfig | null {
  const shared = getSharedMailboxSettings();
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");

  if (!shared || !host || !user || !pass) return null;

  return {
    host,
    port: Number(env("SMTP_PORT") ?? "587"),
    secure: env("SMTP_SECURE") === "true",
    user,
    pass,
    from: shared.from,
    to: shared.to,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSectionsHtml(sections: ReportSection[]) {
  return sections
    .map(
      (section) => `
        <h3 style="margin:28px 0 10px;font-size:15px;letter-spacing:0.08em;text-transform:uppercase;color:#006d56;">
          ${escapeHtml(section.title)}
        </h3>
        <table style="border-collapse:collapse;width:100%;max-width:720px;">
          <tbody>
            ${section.rows
              .map(
                (row) => `
                  <tr>
                    <td style="padding:8px 12px;border:1px solid #dbe7e1;background:#f2f7f3;font-weight:700;width:240px;vertical-align:top;">
                      ${escapeHtml(row.label)}
                    </td>
                    <td style="padding:8px 12px;border:1px solid #dbe7e1;vertical-align:top;">
                      ${escapeHtml(row.value).replaceAll("\n", "<br>")}
                    </td>
                  </tr>`,
              )
              .join("")}
          </tbody>
        </table>`,
    )
    .join("");
}

function renderSectionsText(sections: ReportSection[]) {
  return sections
    .map((section) => {
      const rows = section.rows
        .map((row) => `${row.label}: ${row.value}`)
        .join("\n");
      return `${section.title.toUpperCase()}\n${rows}`;
    })
    .join("\n\n");
}

export function buildInternalHtml(application: CtdApplicationInput) {
  const sections = buildReport(application);

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#10181a;line-height:1.6;">
      <h2 style="margin:0 0 6px;color:#10181a;">New Certified Tournament Director application</h2>
      <p style="margin:0 0 4px;font-size:15px;">
        <strong>${escapeHtml(applicantName(application))}</strong> &middot;
        ${escapeHtml(application.email)} &middot; ${escapeHtml(application.mobilePhone)}
      </p>
      <p style="margin:0;font-size:15px;color:#4a5a55;">
        Territory: ${escapeHtml(formatTerritory(application.primaryTerritory))}
      </p>
      ${renderSectionsHtml(sections)}
    </div>`;
}

export function buildInternalText(application: CtdApplicationInput) {
  return [
    "New Certified Tournament Director application",
    "",
    `Name: ${applicantName(application)}`,
    `Email: ${application.email}`,
    `Phone: ${application.mobilePhone}`,
    `Territory: ${formatTerritory(application.primaryTerritory)}`,
    "",
    renderSectionsText(buildReport(application)),
  ].join("\n");
}

export function buildAutoReplyHtml(application: CtdApplicationInput) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#10181a;line-height:1.7;max-width:640px;">
      <h2 style="margin:0 0 16px;color:#006d56;">We received your application</h2>
      <p style="margin:0 0 16px;">Hi ${escapeHtml(application.firstName)},</p>
      <p style="margin:0 0 16px;">
        Thank you for applying to the ${escapeHtml(PROGRAM_NAME)} operated by War Tournaments LLC.
        This is an automatic confirmation that your application has been received.
      </p>
      <div style="margin:20px 0;padding:16px;border:1px solid #dbe7e1;background:#f2f7f3;">
        <p style="margin:0 0 8px;font-weight:700;">What we received</p>
        <p style="margin:0;">Territory of interest: ${escapeHtml(formatTerritory(application.primaryTerritory))}</p>
        <p style="margin:0;">Email: ${escapeHtml(application.email)}</p>
        <p style="margin:0;">Phone: ${escapeHtml(application.mobilePhone)}</p>
      </div>
      <p style="margin:0 0 16px;">
        War Tournaments LLC is selecting an initial national group of 5–8 candidates, and
        acceptance is competitive. Oakley Foy reviews applications personally and contacts
        individuals who appear to be a strong potential fit.
      </p>
      <p style="margin:0 0 16px;">
        If you have questions or need to add anything, reply to this email or write
        ${escapeHtml(CONTACT_EMAIL)}. Your reply will reach Oakley Foy.
      </p>
      <p style="margin:24px 0 0;font-weight:700;color:#006d56;">War Tournaments LLC | Racquet War</p>
    </div>`;
}

export function buildAutoReplyText(application: CtdApplicationInput) {
  return [
    `Hi ${application.firstName},`,
    "",
    `Thank you for applying to the ${PROGRAM_NAME} operated by War Tournaments LLC.`,
    "This is an automatic confirmation that your application has been received.",
    "",
    `Territory of interest: ${formatTerritory(application.primaryTerritory)}`,
    `Email: ${application.email}`,
    `Phone: ${application.mobilePhone}`,
    "",
    "War Tournaments LLC is selecting an initial national group of 5–8 candidates, and",
    "acceptance is competitive. Oakley Foy reviews applications personally and contacts",
    "individuals who appear to be a strong potential fit.",
    "",
    `If you have questions or need to add anything, reply to this email or write ${CONTACT_EMAIL}.`,
    "Your reply will reach Oakley Foy.",
    "",
    "War Tournaments LLC | Racquet War",
  ].join("\n");
}

/**
 * Microsoft returns the useful part of a failure in the body (AADSTS codes for
 * auth, ErrorAccessDenied and friends for sendMail), so it is worth keeping.
 * Truncated because it is echoed to the admin mail test.
 */
async function readErrorDetail(response: Response) {
  try {
    return (await response.text()).slice(0, 600).trim();
  } catch {
    return "";
  }
}

async function fetchMicrosoftAccessToken(config: MicrosoftMailConfig) {
  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Microsoft Graph authentication failed with status ${response.status}. ${await readErrorDetail(response)}`.trim(),
    );
  }

  const result = (await response.json()) as { access_token?: string };
  if (!result.access_token) {
    throw new Error("Microsoft Graph access token was missing.");
  }

  return result.access_token;
}

async function sendMicrosoftMail(
  config: MicrosoftMailConfig,
  payload: MailPayload,
) {
  const accessToken = await fetchMicrosoftAccessToken(config);

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.from)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: payload.subject,
          body: { contentType: "HTML", content: payload.html },
          toRecipients: [{ emailAddress: { address: payload.to } }],
          replyTo: payload.replyTo
            ? [{ emailAddress: { address: payload.replyTo } }]
            : undefined,
        },
        saveToSentItems: true,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Microsoft Graph sendMail as ${config.from} failed with status ${response.status}. ${await readErrorDetail(response)}`.trim(),
    );
  }
}

async function sendSmtpMail(config: SmtpMailConfig, payload: MailPayload) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    from: config.from,
    to: payload.to,
    replyTo: payload.replyTo,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}

/**
 * Sends the staff notification and the applicant auto-reply. Returns the
 * transport that was used, or "skipped" when no mail transport is configured.
 */
export async function dispatchApplicationEmails(
  application: CtdApplicationInput,
) {
  const microsoft = getMicrosoftMailConfig();
  const smtp = getSmtpMailConfig();
  const transport = microsoft ?? smtp;

  if (!transport) {
    return { mode: "skipped" as MailMode, autoReplyFailed: false };
  }

  const send = (payload: MailPayload) =>
    microsoft
      ? sendMicrosoftMail(microsoft, payload)
      : sendSmtpMail(smtp as SmtpMailConfig, payload);

  const subjectTerritory = formatTerritory(application.primaryTerritory);

  await send({
    to: transport.to,
    replyTo: application.email,
    subject: `CTD application: ${applicantName(application)}${
      subjectTerritory ? ` (${subjectTerritory})` : ""
    }`,
    text: buildInternalText(application),
    html: buildInternalHtml(application),
  });

  // A failed auto-reply must not fail the submission; the application is already saved.
  let autoReplyFailed = false;
  try {
    await send({
      to: application.email,
      replyTo: transport.to,
      subject: `We received your ${PROGRAM_NAME} application`,
      text: buildAutoReplyText(application),
      html: buildAutoReplyHtml(application),
    });
  } catch (error) {
    autoReplyFailed = true;
    console.error("CTD auto-reply failed", error);
  }

  return {
    mode: (microsoft ? "microsoft-graph" : "smtp") as MailMode,
    autoReplyFailed,
  };
}

export function isMailConfigured() {
  return Boolean(getMicrosoftMailConfig() ?? getSmtpMailConfig());
}

/**
 * Reports which transport would be used and which variables are populated,
 * without ever revealing a secret. Backs the admin mail test, because a missing
 * variable and a rejected credential look identical from the outside.
 */
export function describeMailConfig() {
  const shared = getSharedMailboxSettings();
  const microsoft = getMicrosoftMailConfig();
  const smtp = getSmtpMailConfig();

  const isSet = (name: string) => Boolean(process.env[name]?.trim());

  const names = [
    "MAIL_FROM_EMAIL",
    "CTD_TO_EMAIL",
    "MICROSOFT_TENANT_ID",
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
  ];

  // Trimmed automatically before use, but still worth reporting: it means the
  // value in the dashboard is not what whoever set it intended.
  const paddedWithWhitespace = names.filter((name) => {
    const raw = process.env[name];
    return Boolean(raw) && raw !== raw?.trim();
  });

  return {
    transport: microsoft ? "microsoft-graph" : smtp ? "smtp" : "none",
    sendsAs: shared?.from ?? null,
    notifies: shared?.to ?? null,
    paddedWithWhitespace,
    variables: {
      MAIL_FROM_EMAIL: isSet("MAIL_FROM_EMAIL"),
      CTD_TO_EMAIL: isSet("CTD_TO_EMAIL"),
      MICROSOFT_TENANT_ID: isSet("MICROSOFT_TENANT_ID"),
      MICROSOFT_CLIENT_ID: isSet("MICROSOFT_CLIENT_ID"),
      MICROSOFT_CLIENT_SECRET: isSet("MICROSOFT_CLIENT_SECRET"),
      SMTP_HOST: isSet("SMTP_HOST"),
      SMTP_USER: isSet("SMTP_USER"),
      SMTP_PASS: isSet("SMTP_PASS"),
    },
  };
}

/** Sends a single plain message so delivery can be checked without applying. */
export async function sendTestEmail(recipient?: string) {
  const microsoft = getMicrosoftMailConfig();
  const smtp = getSmtpMailConfig();
  const transport = microsoft ?? smtp;

  if (!transport) {
    throw new Error(
      "No mail transport is configured. Set the Microsoft Graph or SMTP variables.",
    );
  }

  const to = recipient?.trim() || transport.to;
  const sentAt = new Date().toISOString();

  const payload: MailPayload = {
    to,
    subject: "Racquet War mail test",
    text: `This is a test message from the Certified Tournament Director form.\n\nSent at ${sentAt}\nFrom mailbox: ${transport.from}`,
    html: `<p>This is a test message from the Certified Tournament Director form.</p><p>Sent at ${escapeHtml(sentAt)}<br>From mailbox: ${escapeHtml(transport.from)}</p>`,
  };

  if (microsoft) {
    await sendMicrosoftMail(microsoft, payload);
  } else {
    await sendSmtpMail(smtp as SmtpMailConfig, payload);
  }

  return { mode: (microsoft ? "microsoft-graph" : "smtp") as MailMode, to };
}
