"use client";

import { useMemo, useState } from "react";

import { saveEventFormAction } from "@/app/tournament-director/portal/actions";
import { ATTACHMENT_ACCEPT } from "@/lib/ctd/attachments";
import {
  BUDGET_DISCLAIMER,
  COURT_SETTINGS,
  EVENT_ACKNOWLEDGMENTS,
  EVENT_SPORT_LABELS,
  EVENT_SPORTS,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  PRICING_NOTICE,
} from "@/lib/ctd/portal-domain";
import {
  calculateEventBudget,
  formatCents,
  parseCents,
  parseQuantity,
} from "@/lib/ctd/portal-money";
import type { DirectorFormMode } from "@/lib/ctd/form-preview";
import type { BudgetItemInput, EventProposalRecord } from "@/lib/ctd/portal-db";

import { PortalSubmitButtons } from "./portal-submit-buttons";

function emptyItem(): BudgetItemInput {
  return {
    category: "facility_court",
    vendor: "",
    description: "",
    quantity: "1",
    unitCost: "",
    costType: "fixed",
    quoteReference: "",
    explanation: "",
  };
}

export function PortalEventForm({
  proposal,
  directorName,
  canEdit,
  mode = "director",
}: {
  proposal: EventProposalRecord;
  directorName: string;
  canEdit: boolean;
  mode?: DirectorFormMode;
}) {
  const isPreview = mode === "admin-preview";
  const [items, setItems] = useState<BudgetItemInput[]>(
    proposal.items.length ? proposal.items : [emptyItem()],
  );
  const [players, setPlayers] = useState(proposal.estimatedPlayers);
  const [entryFee, setEntryFee] = useState(proposal.recommendedEntryFee);
  const [sport, setSport] = useState(proposal.sport);

  const totals = useMemo(() => {
    let fee = 0;
    try {
      fee = entryFee ? parseCents(entryFee) : 0;
    } catch {
      fee = 0;
    }
    const lines = items.map((item) => {
      try {
        return {
          costType: item.costType,
          quantityHundredths: item.quantity ? parseQuantity(item.quantity) : 0,
          unitCents: item.unitCost ? parseCents(item.unitCost) : 0,
        };
      } catch {
        return { costType: item.costType, quantityHundredths: 0, unitCents: 0 };
      }
    });
    return calculateEventBudget(Number(players || 0), fee, lines);
  }, [items, players, entryFee]);

  function updateItem(index: number, patch: Partial<BudgetItemInput>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  return (
    <form
      className="ctd-form"
      action={isPreview ? undefined : saveEventFormAction}
      onSubmit={isPreview ? (event) => event.preventDefault() : undefined}
    >
      {isPreview ? null : <input type="hidden" name="id" value={proposal.id} />}
      <input type="hidden" name="budgetJson" value={JSON.stringify(items)} />

      <fieldset className="ctd-fieldset" disabled={!canEdit}>
        <legend className="ctd-report-title">Event information</legend>
        <div className="ctd-field">
          <label className="ctd-label">Director</label>
          <input className="ctd-input" value={directorName} readOnly />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="eventName">
            Proposed event name
          </label>
          <input
            id="eventName"
            name="eventName"
            className="ctd-input"
            defaultValue={proposal.eventName}
            required={false}
          />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="sport">
            Sport
          </label>
          <select
            id="sport"
            name="sport"
            className="ctd-select"
            value={sport}
            onChange={(event) => setSport(event.target.value)}
          >
            <option value="">Select</option>
            {EVENT_SPORTS.map((value) => (
              <option key={value} value={value}>
                {EVENT_SPORT_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        {sport === "other" ? (
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="sportOther">
              Other racquet sport
            </label>
            <input
              id="sportOther"
              name="sportOther"
              className="ctd-input"
              defaultValue={proposal.sportOther}
            />
          </div>
        ) : (
          <input type="hidden" name="sportOther" value="" />
        )}
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="address">
            Event address
          </label>
          <input id="address" name="address" className="ctd-input" defaultValue={proposal.address} />
        </div>
        <div className="ctd-workflow-grid">
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="city">City</label>
            <input id="city" name="city" className="ctd-input" defaultValue={proposal.city} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="state">State/province</label>
            <input id="state" name="state" className="ctd-input" defaultValue={proposal.state} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="postalCode">Postal/ZIP code</label>
            <input id="postalCode" name="postalCode" className="ctd-input" defaultValue={proposal.postalCode} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="country">Country</label>
            <input id="country" name="country" className="ctd-input" defaultValue={proposal.country} />
          </div>
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="facilityName">Proposed facility name</label>
          <input id="facilityName" name="facilityName" className="ctd-input" defaultValue={proposal.facilityName} />
        </div>
        <div className="ctd-workflow-grid">
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="facilityContactName">Facility contact name</label>
            <input id="facilityContactName" name="facilityContactName" className="ctd-input" defaultValue={proposal.facilityContactName} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="facilityContactEmail">Facility contact email</label>
            <input id="facilityContactEmail" name="facilityContactEmail" className="ctd-input" type="email" defaultValue={proposal.facilityContactEmail} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="facilityContactPhone">Facility contact phone</label>
            <input id="facilityContactPhone" name="facilityContactPhone" className="ctd-input" defaultValue={proposal.facilityContactPhone} />
          </div>
        </div>
        <div className="ctd-workflow-grid">
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="primaryStartDate">Primary start date</label>
            <input id="primaryStartDate" name="primaryStartDate" className="ctd-input" type="date" defaultValue={proposal.primaryStartDate} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="primaryEndDate">Primary end date</label>
            <input id="primaryEndDate" name="primaryEndDate" className="ctd-input" type="date" defaultValue={proposal.primaryEndDate} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="alternateStartDate">Alternate start date</label>
            <input id="alternateStartDate" name="alternateStartDate" className="ctd-input" type="date" defaultValue={proposal.alternateStartDate} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="alternateEndDate">Alternate end date</label>
            <input id="alternateEndDate" name="alternateEndDate" className="ctd-input" type="date" defaultValue={proposal.alternateEndDate} />
          </div>
        </div>
        <div className="ctd-workflow-grid">
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="courtCount">Number of courts</label>
            <input id="courtCount" name="courtCount" className="ctd-input" defaultValue={proposal.courtCount} />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="courtSetting">Indoor, outdoor or combination</label>
            <select id="courtSetting" name="courtSetting" className="ctd-select" defaultValue={proposal.courtSetting}>
              <option value="">Select</option>
              {COURT_SETTINGS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="eventFormat">Proposed event format</label>
          <textarea id="eventFormat" name="eventFormat" className="ctd-textarea" defaultValue={proposal.eventFormat} />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="divisions">Proposed divisions or levels</label>
          <textarea id="divisions" name="divisions" className="ctd-textarea" defaultValue={proposal.divisions} />
        </div>
        <div className="ctd-workflow-grid">
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="estimatedPlayers">Estimated number of players</label>
            <input
              id="estimatedPlayers"
              name="estimatedPlayers"
              className="ctd-input"
              value={players}
              onChange={(event) => setPlayers(event.target.value)}
            />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="recommendedEntryFee">Recommended entry fee per player</label>
            <input
              id="recommendedEntryFee"
              name="recommendedEntryFee"
              className="ctd-input"
              value={entryFee}
              onChange={(event) => setEntryFee(event.target.value)}
            />
          </div>
          <div className="ctd-field">
            <label className="ctd-label" htmlFor="recommendedTeamFee">Recommended team entry fee, if applicable</label>
            <input id="recommendedTeamFee" name="recommendedTeamFee" className="ctd-input" defaultValue={proposal.recommendedTeamFee} />
          </div>
        </div>
        <p className="ctd-notice">{PRICING_NOTICE}</p>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="marketOpportunity">Local market opportunity</label>
          <textarea id="marketOpportunity" name="marketOpportunity" className="ctd-textarea" defaultValue={proposal.marketOpportunity} />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="localRelationships">Existing local player, club and facility relationships</label>
          <textarea id="localRelationships" name="localRelationships" className="ctd-textarea" defaultValue={proposal.localRelationships} />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="competingEvents">Competing or conflicting events</label>
          <textarea id="competingEvents" name="competingEvents" className="ctd-textarea" defaultValue={proposal.competingEvents} />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="facilityTerms">Facility terms or quote details</label>
          <textarea id="facilityTerms" name="facilityTerms" className="ctd-textarea" defaultValue={proposal.facilityTerms} />
        </div>
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="supportingFile">Optional supporting document</label>
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
          <textarea id="additionalNotes" name="additionalNotes" className="ctd-textarea" defaultValue={proposal.additionalNotes} />
        </div>
      </fieldset>

      <fieldset className="ctd-fieldset" disabled={!canEdit}>
        <legend className="ctd-report-title">Proposed budget</legend>
        <div className="ctd-budgetlist">
          {items.map((item, index) => (
            <article key={index} className="ctd-budgetcard">
              <div className="ctd-workflow-grid">
                <div className="ctd-field">
                  <label className="ctd-label">Expense category</label>
                  <select
                    className="ctd-select"
                    value={item.category}
                    onChange={(event) => updateItem(index, { category: event.target.value })}
                  >
                    {EXPENSE_CATEGORIES.map((value) => (
                      <option key={value} value={value}>
                        {EXPENSE_CATEGORY_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ctd-field">
                  <label className="ctd-label">Vendor</label>
                  <input className="ctd-input" value={item.vendor} onChange={(event) => updateItem(index, { vendor: event.target.value })} />
                </div>
                <div className="ctd-field">
                  <label className="ctd-label">Quantity</label>
                  <input className="ctd-input" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} />
                </div>
                <div className="ctd-field">
                  <label className="ctd-label">Cost per unit</label>
                  <input className="ctd-input" value={item.unitCost} onChange={(event) => updateItem(index, { unitCost: event.target.value })} />
                </div>
                <div className="ctd-field">
                  <label className="ctd-label">Cost type</label>
                  <select
                    className="ctd-select"
                    value={item.costType}
                    onChange={(event) =>
                      updateItem(index, {
                        costType: event.target.value === "per_player" ? "per_player" : "fixed",
                      })
                    }
                  >
                    <option value="fixed">Fixed cost</option>
                    <option value="per_player">Per-player cost</option>
                  </select>
                </div>
                <div className="ctd-field">
                  <label className="ctd-label">Quote or reference number</label>
                  <input className="ctd-input" value={item.quoteReference} onChange={(event) => updateItem(index, { quoteReference: event.target.value })} />
                </div>
              </div>
              <div className="ctd-field">
                <label className="ctd-label">Description</label>
                <input className="ctd-input" value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} />
              </div>
              <div className="ctd-field">
                <label className="ctd-label">Director explanation</label>
                <textarea className="ctd-textarea" value={item.explanation} onChange={(event) => updateItem(index, { explanation: event.target.value })} />
              </div>
              {canEdit ? (
                <button
                  className="ctd-linkbutton"
                  type="button"
                  onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                >
                  Remove row
                </button>
              ) : null}
            </article>
          ))}
        </div>
        {canEdit ? (
          <button className="ctd-addbutton" type="button" onClick={() => setItems((current) => [...current, emptyItem()])}>
            Add budget row
          </button>
        ) : null}

        <dl className="ctd-totals">
          <div><dt>Estimated players</dt><dd>{totals.estimatedPlayers}</dd></div>
          <div><dt>Recommended entry fee</dt><dd>{formatCents(totals.recommendedEntryFeeCents)}</dd></div>
          <div><dt>Estimated gross registration revenue</dt><dd>{formatCents(totals.estimatedGrossCents)}</dd></div>
          <div><dt>RW fee at $35 per eligible player</dt><dd>{formatCents(totals.rwFeeCents)}</dd></div>
          <div><dt>Total fixed expenses</dt><dd>{formatCents(totals.totalFixedCents)}</dd></div>
          <div><dt>Total per-player expenses</dt><dd>{formatCents(totals.totalPerPlayerCents)}</dd></div>
          <div><dt>Total proposed event expenses</dt><dd>{formatCents(totals.totalExpensesCents)}</dd></div>
          <div><dt>Proposed expense per player</dt><dd>{formatCents(totals.expensePerPlayerCents)}</dd></div>
          <div><dt>Estimated remaining after RW fee and expenses</dt><dd>{formatCents(totals.remainingCents)}</dd></div>
          <div><dt>Estimated Director compensation</dt><dd>{formatCents(totals.estimatedDirectorCompensationCents)}</dd></div>
        </dl>
        <p className="ctd-notice">{BUDGET_DISCLAIMER}</p>
        {totals.overBaseline ? (
          <div className="ctd-alert" role="status">
            Proposed expenses exceed the $65 per projected player planning baseline.
            An explanation is required before submission. War Tournaments LLC may
            still approve the proposal.
          </div>
        ) : null}
        <div className="ctd-field">
          <label className="ctd-label" htmlFor="overBudgetExplanation">
            Explanation if expenses exceed $65 per projected player
          </label>
          <textarea
            id="overBudgetExplanation"
            name="overBudgetExplanation"
            className="ctd-textarea"
            defaultValue={proposal.overBudgetExplanation}
          />
        </div>
      </fieldset>

      <fieldset className="ctd-fieldset" disabled={!canEdit}>
        <legend className="ctd-report-title">Acknowledgments</legend>
        {EVENT_ACKNOWLEDGMENTS.map((item) => (
          <label key={item.name} className="ctd-check">
            <input
              type="checkbox"
              name={item.name}
              defaultChecked={Boolean(proposal.acknowledgments[item.name])}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </fieldset>

      {canEdit ? (
        <PortalSubmitButtons
          canSubmit
          mode={mode}
          submitLabel="Submit proposal"
        />
      ) : null}
    </form>
  );
}
