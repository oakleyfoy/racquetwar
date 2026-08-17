"use client";

import { useMemo, useState } from "react";

import { saveSponsorshipFormAction } from "@/app/tournament-director/portal/actions";
import { ATTACHMENT_ACCEPT } from "@/lib/ctd/attachments";
import {
  DOUBLE_COUNT_RULE,
  SPONSOR_BENEFIT_LABELS,
  SPONSOR_BENEFITS,
  SPONSORSHIP_ACKNOWLEDGMENTS,
  SPONSORSHIP_STAGE_LABELS,
  SPONSORSHIP_STAGES,
} from "@/lib/ctd/portal-domain";
import { calculateSponsorshipSplit, formatCents, parseCents } from "@/lib/ctd/portal-money";
import type { DirectorFormMode } from "@/lib/ctd/form-preview";
import type { EventProposalRecord, SponsorshipBenefitInput, SponsorshipInput } from "@/lib/ctd/portal-db";

import { PortalSubmitButtons } from "./portal-submit-buttons";

function defaultBenefits(existing: SponsorshipBenefitInput[]) {
  return SPONSOR_BENEFITS.map((id) => {
    const found = existing.find((item) => item.id === id);
    return {
      id,
      selected: Boolean(found?.selected),
      explanation: found?.explanation ?? "",
    };
  });
}

export function PortalSponsorshipForm({
  request,
  directorName,
  events,
  canEdit,
  mode = "director",
}: {
  request: SponsorshipInput & { id: string };
  directorName: string;
  events: EventProposalRecord[];
  canEdit: boolean;
  mode?: DirectorFormMode;
}) {
  const isPreview = mode === "admin-preview";
  const [benefits, setBenefits] = useState(defaultBenefits(request.benefits));
  const [cashAmount, setCashAmount] = useState(request.cashAmount);
  const [requestedNoncash, setRequestedNoncash] = useState(request.requestedNoncashValue);
  const [includesNoncash, setIncludesNoncash] = useState(request.includesNoncash);

  const preview = useMemo(() => {
    let cash = 0;
    let noncash = 0;
    try {
      cash = cashAmount ? parseCents(cashAmount) : 0;
    } catch {
      cash = 0;
    }
    try {
      noncash = includesNoncash && requestedNoncash ? parseCents(requestedNoncash) : 0;
    } catch {
      noncash = 0;
    }
    return {
      cash: calculateSponsorshipSplit(cash, 0),
      requestedNoncash: noncash,
      requestedNoncashSplit: calculateSponsorshipSplit(0, noncash),
    };
  }, [cashAmount, includesNoncash, requestedNoncash]);

  return (
    <form
      className="ctd-form"
      action={isPreview ? undefined : saveSponsorshipFormAction}
      onSubmit={isPreview ? (event) => event.preventDefault() : undefined}
    >
      {isPreview ? null : <input type="hidden" name="id" value={request.id} />}
      <input type="hidden" name="benefitsJson" value={JSON.stringify(benefits)} />

      <fieldset className="ctd-fieldset" disabled={!canEdit}>
        <legend className="ctd-report-title">Sponsor information</legend>
        <div className="ctd-field">
          <label className="ctd-label">Director</label>
          <input className="ctd-input" value={directorName} readOnly />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="sponsorName">Sponsor/company name</label>
          <input id="sponsorName" name="sponsorName" className="ctd-input" defaultValue={request.sponsorName} />
        </div>
        <div className="ctd-workflow-grid">
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="sponsorContactName">Sponsor contact name</label>
            <input id="sponsorContactName" name="sponsorContactName" className="ctd-input" defaultValue={request.sponsorContactName} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="sponsorEmail">Sponsor email</label>
            <input id="sponsorEmail" name="sponsorEmail" className="ctd-input" type="email" defaultValue={request.sponsorEmail} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="sponsorPhone">Sponsor phone</label>
            <input id="sponsorPhone" name="sponsorPhone" className="ctd-input" defaultValue={request.sponsorPhone} />
          </div>
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="sponsorWebsite">Sponsor website</label>
          <input id="sponsorWebsite" name="sponsorWebsite" className="ctd-input" defaultValue={request.sponsorWebsite} />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="businessCategory">Sponsor business category</label>
          <input id="businessCategory" name="businessCategory" className="ctd-input" defaultValue={request.businessCategory} />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="eventProposalId">Associated event (optional)</label>
          <select id="eventProposalId" name="eventProposalId" className="ctd-select" defaultValue={request.eventProposalId}>
            <option value="">General market sponsorship — not yet linked to an event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.eventName || "Untitled proposal"} ({event.currentStatus})
              </option>
            ))}
          </select>
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="territory">Territory or market</label>
          <input id="territory" name="territory" className="ctd-input" defaultValue={request.territory} />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="stage">Sponsorship stage</label>
          <select id="stage" name="stage" className="ctd-select" defaultValue={request.stage}>
            <option value="">Select</option>
            {SPONSORSHIP_STAGES.map((value) => (
              <option key={value} value={value}>
                {SPONSORSHIP_STAGE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="ctd-workflow-grid">
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="startDate">Proposed start date</label>
            <input id="startDate" name="startDate" className="ctd-input" type="date" defaultValue={request.startDate} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="endDate">Proposed end date</label>
            <input id="endDate" name="endDate" className="ctd-input" type="date" defaultValue={request.endDate} />
          </div>
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="cashAmount">Cash sponsorship amount</label>
          <input
            id="cashAmount"
            name="cashAmount"
            className="ctd-input"
            value={cashAmount}
            onChange={(event) => setCashAmount(event.target.value)}
          />
        </div>
        <label className="ctd-check">
          <input
            type="checkbox"
            name="includesNoncash"
            checked={includesNoncash}
            onChange={(event) => setIncludesNoncash(event.target.checked)}
          />
          <span>Noncash goods or services are included</span>
        </label>
        {includesNoncash ? (
          <>
            <div className="ctd-field">
              <label className="ctd-label" htmlFor="noncashDescription">Description of noncash goods or services</label>
              <textarea id="noncashDescription" name="noncashDescription" className="ctd-textarea" defaultValue={request.noncashDescription} />
            </div>
            <div className="ctd-workflow-grid">
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="noncashQuantity">Quantity</label>
                <input id="noncashQuantity" name="noncashQuantity" className="ctd-input" defaultValue={request.noncashQuantity} />
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="requestedNoncashValue">Director’s estimated fair-market value</label>
                <input
                  id="requestedNoncashValue"
                  name="requestedNoncashValue"
                  className="ctd-input"
                  value={requestedNoncash}
                  onChange={(event) => setRequestedNoncash(event.target.value)}
                />
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="deliveryDate">Proposed delivery date</label>
                <input id="deliveryDate" name="deliveryDate" className="ctd-input" type="date" defaultValue={request.deliveryDate} />
              </div>
            </div>
            <div className="ctd-field">
              <label className="ctd-label" htmlFor="valueExplanation">Explanation or documentation supporting the value</label>
              <textarea id="valueExplanation" name="valueExplanation" className="ctd-textarea" defaultValue={request.valueExplanation} />
            </div>
            <p className="ctd-notice">
              The Director-entered noncash value is a request only. War Tournaments LLC
              enters the final approved value.
            </p>
          </>
        ) : (
          <>
            <input type="hidden" name="noncashDescription" value="" />
            <input type="hidden" name="noncashQuantity" value="" />
            <input type="hidden" name="requestedNoncashValue" value="" />
            <input type="hidden" name="valueExplanation" value="" />
            <input type="hidden" name="deliveryDate" value="" />
          </>
        )}
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="supportingFile">Sponsorship proposal or correspondence</label>
          {isPreview ? (
            <p className="ctd-subtle">File uploads are disabled in preview mode.</p>
          ) : (
            <>
              <input id="supportingFile" name="supportingFile" className="ctd-input" type="file" accept={ATTACHMENT_ACCEPT} />
              <p className="ctd-subtle">PDF, DOCX, XLSX, JPG or PNG. 8 MB limit.</p>
            </>
          )}
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="additionalNotes">Additional notes</label>
          <textarea id="additionalNotes" name="additionalNotes" className="ctd-textarea" defaultValue={request.additionalNotes} />
        </div>
      </fieldset>

      <fieldset className="ctd-fieldset" disabled={!canEdit}>
        <legend className="ctd-report-title">Requested sponsor benefits</legend>
        {benefits.map((benefit, index) => (
          <div key={benefit.id} className="ctd-budgetcard">
            <label className="ctd-check">
              <input
                type="checkbox"
                checked={benefit.selected}
                onChange={(event) =>
                  setBenefits((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, selected: event.target.checked } : item,
                    ),
                  )
                }
              />
              <span>{SPONSOR_BENEFIT_LABELS[benefit.id as keyof typeof SPONSOR_BENEFIT_LABELS]}</span>
            </label>
            {benefit.selected ? (
              <div className="ctd-field">
                <label className="ctd-label">Explanation</label>
                <textarea
                  className="ctd-textarea"
                  value={benefit.explanation}
                  onChange={(event) =>
                    setBenefits((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, explanation: event.target.value } : item,
                      ),
                    )
                  }
                />
              </div>
            ) : null}
          </div>
        ))}
      </fieldset>

      <section className="ctd-reviewpanel">
        <h2 className="ctd-report-title">Sponsorship calculation</h2>
        <dl className="ctd-totals">
          <div><dt>Total cash value</dt><dd>{formatCents(preview.cash.cashCents)}</dd></div>
          <div><dt>War Tournaments share: 25%</dt><dd>{formatCents(preview.cash.cashWarCents)}</dd></div>
          <div><dt>Director share: 75%</dt><dd>{formatCents(preview.cash.cashDirectorCents)}</dd></div>
          <div><dt>Requested noncash value</dt><dd>{formatCents(preview.requestedNoncash)} (request only)</dd></div>
          <div><dt>Requested noncash — War Tournaments share 25% (illustration only)</dt><dd>{formatCents(preview.requestedNoncashSplit.noncashWarCents)}</dd></div>
          <div><dt>Requested noncash — Director share 75% (illustration only)</dt><dd>{formatCents(preview.requestedNoncashSplit.noncashDirectorCents)}</dd></div>
          <div><dt>Approved noncash value</dt><dd>$0.00 until War Tournaments approves a value</dd></div>
        </dl>
        <p className="ctd-notice">{DOUBLE_COUNT_RULE}</p>
      </section>

      <fieldset className="ctd-fieldset" disabled={!canEdit}>
        <legend className="ctd-report-title">Acknowledgments</legend>
        {SPONSORSHIP_ACKNOWLEDGMENTS.map((item) => (
          <label key={item.name} className="ctd-check">
            <input
              type="checkbox"
              name={item.name}
              defaultChecked={Boolean(request.acknowledgments[item.name])}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </fieldset>

      {canEdit ? (
        <PortalSubmitButtons
          canSubmit
          mode={mode}
          submitLabel="Submit request"
        />
      ) : null}
    </form>
  );
}
