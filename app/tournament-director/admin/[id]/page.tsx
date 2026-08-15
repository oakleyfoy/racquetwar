import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminConfirmForm } from "@/components/ctd/admin-confirm-form";
import { AdminDeleteApplicationForm } from "@/components/ctd/admin-delete-application-form";
import { AdminStatusForm } from "@/components/ctd/admin-status-form";
import { buildCandidateEmail } from "@/lib/ctd/candidate-mail";
import { applicantName, buildReport, formatSubmittedAt } from "@/lib/ctd/report";
import { CONTACT_NAME, PROGRAM_NAME } from "@/lib/ctd/site";
import {
  ACTIVITY_TYPE_LABELS,
  ADMIN_TIMEZONE,
  CANDIDATE_TIMEZONES,
  SCREENING_METHOD_LABELS,
  SCREENING_METHODS,
  SCREENING_OUTCOME_LABELS,
  SCREENING_OUTCOMES,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUSES,
  isScreeningMethod,
  requiresStatusConfirmation,
  statusConfirmationMessage,
} from "@/lib/ctd/workflow";
import { getScreeningBookingUrl } from "@/lib/ctd/scheduling";
import { getWorkspace } from "@/lib/ctd/workflow-db";
import {
  formatInstantInTimeZone,
  followUpUrgency,
  splitDateAndTimeForInput,
} from "@/lib/ctd/workflow-time";

import {
  addFollowUpAction,
  addNoteAction,
  advanceCandidateAction,
  cancelScreeningAction,
  declineCandidateAction,
  holdCandidateAction,
  recordScreeningOutcomeAction,
  confirmBookingAction,
  scheduleScreeningAction,
  selectCandidateAction,
  sendCandidateEmailAction,
  sendScreeningInvitationAction,
  toggleFollowUpAction,
} from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review applicant | Racquet War",
  robots: { index: false, follow: false },
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NOTICES: Record<string, string> = {
  saved: "Workflow changes saved. No email was sent.",
  emailed: "Candidate email sent.",
  email_failed:
    "The workflow change was saved, but the candidate email could not be sent.",
  note_added: "Internal note added.",
  followup_added: "Follow-up created.",
  followup_updated: "Follow-up updated.",
  invited: "Screening invitation sent. Status is now Screening Invited.",
  booking_confirmed: "Booked appointment recorded. Status is now Screening Scheduled.",
  booking_url_missing:
    "Set CTD_SCREENING_BOOKING_URL before sending a Microsoft Bookings invitation.",
  scheduled: "Screening call saved without emailing.",
  rescheduled: "Screening call rescheduled without emailing.",
  canceled: "Screening call canceled without emailing.",
  outcome: "Screening outcome recorded.",
  advanced: "Candidate marked Advanced. No email was sent.",
  hold: "Candidate put on hold. No email was sent.",
  declined: "Candidate declined. No email was sent.",
  selected:
    "Candidate marked Selected (internal status only). No email was sent.",
  confirm_required: "That action needs confirmation before it can run.",
  reason_required: "Enter the required reason before continuing.",
  hold_date_required: "A follow-up date is required to put a candidate on hold.",
  schedule_invalid: "Enter a valid screening date, time, timezone, and method.",
  invalid_status: "That status is not valid.",
  note_required: "Enter a note before saving.",
  followup_required: "Enter a follow-up action before saving.",
  followup_missing: "That follow-up was not found.",
  outcome_invalid: "Choose a valid screening outcome.",
};

export default async function AdminApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; notice?: string }>;
}) {
  const { id } = await params;
  const { saved, notice } = await searchParams;

  if (!UUID_PATTERN.test(id)) notFound();

  const workspace = await getWorkspace(id);
  if (!workspace) notFound();

  const { application, workflow, notes, followUps, activities } = workspace;
  const sections = buildReport(application);
  const flash = notice ? NOTICES[notice] : saved ? "Changes saved." : null;
  const isError = Boolean(
    notice &&
      [
        "confirm_required",
        "reason_required",
        "hold_date_required",
        "schedule_invalid",
        "booking_url_missing",
        "invalid_status",
        "note_required",
        "followup_required",
        "followup_missing",
        "outcome_invalid",
        "email_failed",
      ].includes(notice),
  );

  const scheduledInputs = splitDateAndTimeForInput(
    workflow.screeningScheduledAt,
    workflow.screeningTimezone || ADMIN_TIMEZONE,
  );
  const method = isScreeningMethod(workflow.screeningMethod)
    ? workflow.screeningMethod
    : "phone";
  const screeningDetails =
    workflow.screeningScheduledAt && isScreeningMethod(workflow.screeningMethod)
      ? {
          scheduledAt: workflow.screeningScheduledAt,
          timeZone: workflow.screeningTimezone || ADMIN_TIMEZONE,
          method: workflow.screeningMethod,
          locationOrLink: workflow.screeningLocationOrLink,
        }
      : undefined;

  const bookingUrl = getScreeningBookingUrl();
  const invitation = bookingUrl
    ? buildCandidateEmail("screening_invitation", { application, bookingUrl })
    : null;
  const confirmation = screeningDetails
    ? buildCandidateEmail("screening_confirmation", {
        application,
        screening: screeningDetails,
      })
    : null;
  const reschedule = screeningDetails
    ? buildCandidateEmail("screening_reschedule", {
        application,
        screening: screeningDetails,
      })
    : null;
  const cancellation = buildCandidateEmail("screening_cancellation", {
    application,
  });
  const advancement = buildCandidateEmail("advancement", { application });
  const hold = buildCandidateEmail("hold", { application });
  const decline = buildCandidateEmail("decline", { application });
  const selection = buildCandidateEmail("selection", { application });

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <Link className="ctd-back" href="/tournament-director/admin">
          ← All applicants
        </Link>

        <div className="ctd-admin-head" style={{ marginTop: 12 }}>
          <div>
            <h1 className="ctd-section-title">{applicantName(application)}</h1>
            <p className="ctd-section-hint">
              Submitted {formatSubmittedAt(application.submittedAt)}
            </p>
            <p className="ctd-contactline">
              <a href={`mailto:${application.email}`}>{application.email}</a>
              <br />
              <a href={`tel:${application.mobilePhone}`}>
                {application.mobilePhone}
              </a>
            </p>
          </div>
          <span className={`ctd-badge ctd-badge-${workflow.currentStatus}`}>
            {WORKFLOW_STATUS_LABELS[workflow.currentStatus]}
          </span>
        </div>

        {flash ? (
          <div className={isError ? "ctd-alert" : "ctd-saved"} role="status">
            {flash}
          </div>
        ) : null}

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Workflow</h2>
          <AdminStatusForm
            applicationId={application.id}
            currentStatus={workflow.currentStatus}
          >
            <div className="ctd-grid ctd-grid-2">
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="ctd-select"
                  defaultValue={workflow.currentStatus}
                >
                  {WORKFLOW_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {WORKFLOW_STATUS_LABELS[value]}
                      {requiresStatusConfirmation(workflow.currentStatus, value)
                        ? " (requires confirmation)"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="assignedTo">
                  Assigned to
                </label>
                <input
                  id="assignedTo"
                  name="assignedTo"
                  className="ctd-input"
                  defaultValue={workflow.assignedTo}
                />
              </div>
              <div className="ctd-field ctd-span-2">
                <label className="ctd-label" htmlFor="nextAction">
                  Next action
                </label>
                <input
                  id="nextAction"
                  name="nextAction"
                  className="ctd-input"
                  defaultValue={workflow.nextAction}
                />
              </div>
            </div>
            <button className="ctd-submit" type="submit">
              Save workflow
            </button>
          </AdminStatusForm>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Controlled decisions</h2>
          <p className="ctd-section-hint">
            These change internal status only. Emails are optional and never send
            unless you confirm a separate send action.
          </p>
          <div className="ctd-workflow-grid">
            <AdminConfirmForm
              action={advanceCandidateAction}
              confirmMessage={
                requiresStatusConfirmation(workflow.currentStatus, "advanced")
                  ? statusConfirmationMessage(workflow.currentStatus, "advanced")
                  : undefined
              }
            >
              <input type="hidden" name="id" value={application.id} />
              <label className="ctd-label" htmlFor="advance-reason">
                Advance candidate
              </label>
              <textarea
                id="advance-reason"
                name="reason"
                className="ctd-textarea"
                required
                placeholder="Short advancement reason (saved to activity history)"
              />
              <button className="ctd-addbutton" type="submit">
                Advance candidate
              </button>
            </AdminConfirmForm>

            <AdminConfirmForm
              action={holdCandidateAction}
              confirmMessage={
                requiresStatusConfirmation(workflow.currentStatus, "on_hold")
                  ? statusConfirmationMessage(workflow.currentStatus, "on_hold")
                  : undefined
              }
            >
              <input type="hidden" name="id" value={application.id} />
              <label className="ctd-label" htmlFor="hold-reason">
                Put on hold
              </label>
              <textarea
                id="hold-reason"
                name="reason"
                className="ctd-textarea"
                required
                placeholder="Short reason"
              />
              <label className="ctd-label" htmlFor="holdDueDate">
                Follow-up date
              </label>
              <input
                id="holdDueDate"
                name="holdDueDate"
                className="ctd-input"
                type="date"
                required
              />
              <input
                name="holdDueTime"
                className="ctd-input"
                type="time"
                defaultValue="09:00"
              />
              <button className="ctd-addbutton" type="submit">
                Put on hold
              </button>
            </AdminConfirmForm>

            <AdminConfirmForm
              action={declineCandidateAction}
              confirmMessage="Decline this candidate? This is an internal status change and will not email them."
            >
              <input type="hidden" name="id" value={application.id} />
              <label className="ctd-label" htmlFor="decline-reason">
                Decline candidate
              </label>
              <textarea
                id="decline-reason"
                name="reason"
                className="ctd-textarea"
                required
                placeholder="Internal decline reason"
              />
              <button className="ctd-deletebutton" type="submit">
                Decline candidate
              </button>
            </AdminConfirmForm>

            <AdminConfirmForm
              action={selectCandidateAction}
              confirmMessage="Mark this candidate as selected for the initial group? This is an internal status only. It does not certify them, grant territory, or send an email."
            >
              <input type="hidden" name="id" value={application.id} />
              <label className="ctd-label" htmlFor="select-reason">
                Select for initial group
              </label>
              <textarea
                id="select-reason"
                name="reason"
                className="ctd-textarea"
                required
                placeholder="Internal selection note"
              />
              <p className="ctd-subtle">
                Internal selection only. This does not create a contract, grant
                territory, or promise certification.
              </p>
              <button className="ctd-submit" type="submit">
                Mark selected
              </button>
            </AdminConfirmForm>
          </div>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Screening call</h2>
          <p className="ctd-section-hint">
            Primary path: send Oakley&apos;s Microsoft Bookings invitation, then
            confirm the appointment the candidate booked.
          </p>
          {bookingUrl ? (
            <AdminConfirmForm
              action={sendScreeningInvitationAction}
              confirmMessage="Send the Microsoft Bookings screening invitation? This emails the candidate a scheduling button and, if delivery succeeds, sets status to Screening Invited."
            >
              <input type="hidden" name="id" value={application.id} />
              <button className="ctd-submit" type="submit">
                Send screening invitation
              </button>
            </AdminConfirmForm>
          ) : (
            <div className="ctd-alert" role="status">
              Screening invitations cannot be sent until{" "}
              <code>CTD_SCREENING_BOOKING_URL</code> is set on the server.
            </div>
          )}

          <h3 className="ctd-report-title">Confirm booking</h3>
          <p className="ctd-section-hint">
            Enter the date, time, method, and meeting details shown in Microsoft
            Bookings. This moves Screening Invited to Screening Scheduled.
          </p>
          <AdminConfirmForm action={confirmBookingAction}>
            <input type="hidden" name="id" value={application.id} />
            <div className="ctd-grid ctd-grid-2">
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="confirm-date">
                  Date
                </label>
                <input
                  id="confirm-date"
                  name="date"
                  className="ctd-input"
                  type="date"
                  required
                  defaultValue={scheduledInputs.date}
                />
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="confirm-time">
                  Time
                </label>
                <input
                  id="confirm-time"
                  name="time"
                  className="ctd-input"
                  type="time"
                  required
                  defaultValue={scheduledInputs.time}
                />
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="confirm-tz">
                  Candidate timezone
                </label>
                <select
                  id="confirm-tz"
                  name="timeZone"
                  className="ctd-select"
                  defaultValue={workflow.screeningTimezone || ADMIN_TIMEZONE}
                >
                  {CANDIDATE_TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="confirm-method">
                  Method
                </label>
                <select
                  id="confirm-method"
                  name="method"
                  className="ctd-select"
                  defaultValue={method}
                >
                  {SCREENING_METHODS.map((value) => (
                    <option key={value} value={value}>
                      {SCREENING_METHOD_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ctd-field ctd-span-2">
                <label className="ctd-label" htmlFor="confirm-link">
                  Meeting link or instructions from Bookings
                </label>
                <textarea
                  id="confirm-link"
                  name="locationOrLink"
                  className="ctd-textarea"
                  defaultValue={workflow.screeningLocationOrLink}
                />
              </div>
            </div>
            <button className="ctd-addbutton" type="submit">
              Confirm booking
            </button>
          </AdminConfirmForm>

          {workflow.screeningScheduledAt ? (
            <div className="ctd-callbox">
              <p>
                <strong>Candidate local:</strong>{" "}
                {formatInstantInTimeZone(
                  workflow.screeningScheduledAt,
                  workflow.screeningTimezone || ADMIN_TIMEZONE,
                )}
              </p>
              <p>
                <strong>Administrator ({ADMIN_TIMEZONE}):</strong>{" "}
                {formatInstantInTimeZone(
                  workflow.screeningScheduledAt,
                  ADMIN_TIMEZONE,
                )}
              </p>
              <p>
                <strong>Method:</strong>{" "}
                {isScreeningMethod(workflow.screeningMethod)
                  ? SCREENING_METHOD_LABELS[workflow.screeningMethod]
                  : workflow.screeningMethod || "—"}
              </p>
              <p>
                <strong>Link or instructions:</strong>{" "}
                {workflow.screeningLocationOrLink || "—"}
              </p>
            </div>
          ) : (
            <p className="ctd-section-hint">No screening call is scheduled.</p>
          )}

          <h3 className="ctd-report-title">Manual scheduling backup</h3>
          <p className="ctd-section-hint">
            Use only if Microsoft Bookings cannot be used. The Bookings
            invitation remains the primary workflow.
          </p>
          <AdminConfirmForm
            action={scheduleScreeningAction}
            confirmIntent="save_and_send"
            confirmMessage="Send this screening email to the applicant? Reply-To will be the staff inbox."
          >
            <input type="hidden" name="id" value={application.id} />
            <div className="ctd-grid ctd-grid-2">
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="screen-date">
                  Date
                </label>
                <input
                  id="screen-date"
                  name="date"
                  className="ctd-input"
                  type="date"
                  required
                  defaultValue={scheduledInputs.date}
                />
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="screen-time">
                  Time
                </label>
                <input
                  id="screen-time"
                  name="time"
                  className="ctd-input"
                  type="time"
                  required
                  defaultValue={scheduledInputs.time}
                />
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="screen-tz">
                  Candidate timezone
                </label>
                <select
                  id="screen-tz"
                  name="timeZone"
                  className="ctd-select"
                  defaultValue={workflow.screeningTimezone || ADMIN_TIMEZONE}
                >
                  {CANDIDATE_TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="screen-method">
                  Method
                </label>
                <select
                  id="screen-method"
                  name="method"
                  className="ctd-select"
                  defaultValue={method}
                >
                  {SCREENING_METHODS.map((value) => (
                    <option key={value} value={value}>
                      {SCREENING_METHOD_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ctd-field ctd-span-2">
                <label className="ctd-label" htmlFor="screen-link">
                  Meeting link, phone instructions, or location
                </label>
                <textarea
                  id="screen-link"
                  name="locationOrLink"
                  className="ctd-textarea"
                  defaultValue={workflow.screeningLocationOrLink}
                />
              </div>
              <div className="ctd-field ctd-span-2">
                <label className="ctd-label" htmlFor="screen-prep">
                  Internal preparation note
                </label>
                <textarea
                  id="screen-prep"
                  name="preparationNote"
                  className="ctd-textarea"
                  placeholder="Saved as an internal note. Never included in candidate email."
                />
              </div>
            </div>
            <div className="ctd-buttonrow">
              <button className="ctd-addbutton" name="intent" value="save" type="submit">
                Save without emailing
              </button>
              <button
                className="ctd-submit"
                name="intent"
                value="save_and_send"
                type="submit"
              >
                {workflow.screeningScheduledAt
                  ? "Reschedule and notify candidate"
                  : "Save and send confirmation"}
              </button>
            </div>
          </AdminConfirmForm>

          {workflow.screeningScheduledAt ? (
            <AdminConfirmForm
              action={cancelScreeningAction}
              confirmIntent="save_and_send"
              confirmMessage="Cancel this screening call and email the applicant?"
            >
              <input type="hidden" name="id" value={application.id} />
              <div className="ctd-buttonrow">
                <button className="ctd-linkbutton" name="intent" value="save" type="submit">
                  Cancel without emailing
                </button>
                <button
                  className="ctd-deletebutton"
                  name="intent"
                  value="save_and_send"
                  type="submit"
                >
                  Cancel and notify candidate
                </button>
              </div>
            </AdminConfirmForm>
          ) : null}

          <AdminConfirmForm action={recordScreeningOutcomeAction}>
            <input type="hidden" name="id" value={application.id} />
            <div className="ctd-grid ctd-grid-2">
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="outcome">
                  Screening outcome
                </label>
                <select
                  id="outcome"
                  name="outcome"
                  className="ctd-select"
                  defaultValue={workflow.screeningOutcome || "possible_fit"}
                >
                  {SCREENING_OUTCOMES.map((value) => (
                    <option key={value} value={value}>
                      {SCREENING_OUTCOME_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="next-step">
                  Recommended next step
                </label>
                <input
                  id="next-step"
                  name="recommendedNextStep"
                  className="ctd-input"
                  defaultValue={workflow.recommendedNextStep}
                />
              </div>
              <div className="ctd-field ctd-span-2">
                <label className="ctd-label" htmlFor="summary">
                  Screening summary
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  className="ctd-textarea"
                  defaultValue={workflow.screeningSummary}
                />
              </div>
            </div>
            <button className="ctd-addbutton" type="submit">
              Record screening outcome
            </button>
          </AdminConfirmForm>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Internal notes</h2>
          <p className="ctd-internal-label">Internal — not visible to applicant</p>
          <AdminConfirmForm action={addNoteAction}>
            <input type="hidden" name="id" value={application.id} />
            <textarea
              name="note"
              className="ctd-textarea"
              required
              placeholder="Add an internal note. Previous notes are kept."
            />
            <button className="ctd-addbutton" type="submit">
              Add note
            </button>
          </AdminConfirmForm>
          {notes.length === 0 ? (
            <p className="ctd-subtle">No internal notes yet.</p>
          ) : (
            <ol className="ctd-notelist">
              {notes.map((note) => (
                <li key={note.id}>
                  <div className="ctd-subtle">
                    {formatSubmittedAt(note.createdAt)} · {note.createdBy}
                  </div>
                  <p className="ctd-notebody">{note.note}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Follow-up actions</h2>
          <AdminConfirmForm action={addFollowUpAction}>
            <input type="hidden" name="id" value={application.id} />
            <div className="ctd-grid ctd-grid-2">
              <div className="ctd-field ctd-span-2">
                <label className="ctd-label" htmlFor="follow-desc">
                  Action
                </label>
                <input
                  id="follow-desc"
                  name="actionDescription"
                  className="ctd-input"
                  required
                />
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="dueDate">
                  Due date
                </label>
                <input id="dueDate" name="dueDate" className="ctd-input" type="date" />
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="dueTime">
                  Due time
                </label>
                <input
                  id="dueTime"
                  name="dueTime"
                  className="ctd-input"
                  type="time"
                  defaultValue="09:00"
                />
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="follow-assigned">
                  Assigned person
                </label>
                <input
                  id="follow-assigned"
                  name="assignedTo"
                  className="ctd-input"
                  defaultValue={workflow.assignedTo || CONTACT_NAME}
                />
              </div>
            </div>
            <button className="ctd-addbutton" type="submit">
              Create follow-up
            </button>
          </AdminConfirmForm>
          {followUps.length === 0 ? (
            <p className="ctd-subtle">No follow-ups yet.</p>
          ) : (
            <ul className="ctd-followlist">
              {followUps.map((item) => {
                const urgency = followUpUrgency(item.dueAt, item.completedAt);
                return (
                  <li key={item.id}>
                    <div>
                      <strong>{item.actionDescription}</strong>
                      <div className="ctd-subtle">
                        {item.assignedTo ? `${item.assignedTo} · ` : ""}
                        {item.dueAt ? formatSubmittedAt(item.dueAt) : "No due date"}
                        {urgency.completed
                          ? ` · Completed ${formatSubmittedAt(item.completedAt ?? "")}`
                          : ""}
                      </div>
                      {urgency.overdue ? (
                        <span className="ctd-flag ctd-flag-overdue">Overdue</span>
                      ) : null}
                      {urgency.dueToday ? (
                        <span className="ctd-flag ctd-flag-today">Due today</span>
                      ) : null}
                    </div>
                    <AdminConfirmForm action={toggleFollowUpAction}>
                      <input type="hidden" name="id" value={application.id} />
                      <input type="hidden" name="followUpId" value={item.id} />
                      <input
                        type="hidden"
                        name="completed"
                        value={urgency.completed ? "0" : "1"}
                      />
                      <button className="ctd-linkbutton" type="submit">
                        {urgency.completed ? "Reopen" : "Complete"}
                      </button>
                    </AdminConfirmForm>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Candidate communication</h2>
          <p className="ctd-section-hint">
            Sending requires confirmation. Reply-To is the staff inbox used by{" "}
            {PROGRAM_NAME}. Previews never include internal notes.
          </p>
          {invitation ? (
            <EmailPreview
              id={application.id}
              type="screening_invitation"
              label="Send screening invitation"
              subject={invitation.subject}
              text={invitation.text}
            />
          ) : null}
          {confirmation ? (
            <EmailPreview
              id={application.id}
              type="screening_confirmation"
              label="Send scheduled-call confirmation"
              subject={confirmation.subject}
              text={confirmation.text}
            />
          ) : null}
          {reschedule ? (
            <EmailPreview
              id={application.id}
              type="screening_reschedule"
              label="Send reschedule notice"
              subject={reschedule.subject}
              text={reschedule.text}
            />
          ) : null}
          <EmailPreview
            id={application.id}
            type="screening_cancellation"
            label="Send cancellation notice"
            subject={cancellation.subject}
            text={cancellation.text}
          />
          <EmailPreview
            id={application.id}
            type="advancement"
            label="Send advancement email"
            subject={advancement.subject}
            text={advancement.text}
          />
          <EmailPreview
            id={application.id}
            type="hold"
            label="Send hold email"
            subject={hold.subject}
            text={hold.text}
          />
          <EmailPreview
            id={application.id}
            type="decline"
            label="Send decline email"
            subject={decline.subject}
            text={decline.text}
          />
          <EmailPreview
            id={application.id}
            type="selection"
            label="Send selection notification"
            subject={selection.subject}
            text={selection.text}
          />
        </section>

        {sections.map((section) => (
          <section className="ctd-report-section" key={section.title}>
            <h2 className="ctd-report-title">{section.title}</h2>
            <dl className="ctd-report-list">
              {section.rows.map((row) => (
                <div className="ctd-report-row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd className={row.multiline ? "ctd-report-longtext" : undefined}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Activity history</h2>
          {activities.length === 0 ? (
            <p className="ctd-subtle">No workflow activity yet.</p>
          ) : (
            <ol className="ctd-activitylist">
              {activities.map((activity) => (
                <li key={activity.id}>
                  <strong>
                    {ACTIVITY_TYPE_LABELS[
                      activity.activityType as keyof typeof ACTIVITY_TYPE_LABELS
                    ] ?? activity.activityType}
                  </strong>
                  <div className="ctd-subtle">
                    {formatSubmittedAt(activity.createdAt)} · {activity.createdBy}
                  </div>
                  <p>{activity.description}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <AdminDeleteApplicationForm
          id={application.id}
          applicantLabel={applicantName(application)}
        />
      </div>
    </main>
  );
}

function EmailPreview({
  id,
  type,
  label,
  subject,
  text,
}: {
  id: string;
  type: string;
  label: string;
  subject: string;
  text: string;
}) {
  return (
    <div className="ctd-emailpreview">
      <h3>{label}</h3>
      <p>
        <strong>Subject:</strong> {subject}
      </p>
      <pre>{text}</pre>
      <AdminConfirmForm
        action={sendCandidateEmailAction}
        confirmMessage="Send this email to the applicant now? It will come from the program mailbox, and replies will go to the staff inbox."
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="emailType" value={type} />
        <button className="ctd-addbutton" type="submit">
          {label}
        </button>
      </AdminConfirmForm>
    </div>
  );
}
