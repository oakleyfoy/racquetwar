import { readFormFile } from "./attachments";
import { query } from "./db";
import type { DirectorRecord } from "./director-db";
import {
  calculateEventBudget,
  calculateSponsorshipSplit,
  parseCents,
  parseQuantity,
  type EventBudgetTotals,
} from "./portal-money";
import {
  directorCanEditEvent,
  directorCanEditSponsorship,
  directorCanWithdrawEvent,
  directorCanWithdrawSponsorship,
  EVENT_ACKNOWLEDGMENTS,
  isAdminOnlyEventStatus,
  isAdminOnlySponsorshipStatus,
  isEventStatus,
  isSponsorshipStatus,
  newReference,
  SPONSORSHIP_ACKNOWLEDGMENTS,
  type EventStatus,
  type SponsorshipStatus,
} from "./portal-domain";
import { WORKFLOW_ACTOR } from "./workflow";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BudgetItemInput = {
  category: string;
  vendor: string;
  description: string;
  quantity: string;
  unitCost: string;
  costType: "fixed" | "per_player";
  quoteReference: string;
  explanation: string;
};

export type EventProposalInput = {
  eventName: string;
  sport: string;
  sportOther: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  facilityName: string;
  facilityContactName: string;
  facilityContactEmail: string;
  facilityContactPhone: string;
  primaryStartDate: string;
  primaryEndDate: string;
  alternateStartDate: string;
  alternateEndDate: string;
  courtCount: string;
  courtSetting: string;
  eventFormat: string;
  divisions: string;
  estimatedPlayers: string;
  recommendedEntryFee: string;
  recommendedTeamFee: string;
  marketOpportunity: string;
  localRelationships: string;
  competingEvents: string;
  facilityTerms: string;
  additionalNotes: string;
  overBudgetExplanation: string;
  acknowledgments: Record<string, boolean>;
  items: BudgetItemInput[];
};

export type EventProposalRecord = EventProposalInput & {
  id: string;
  directorId: string;
  currentStatus: EventStatus;
  currentVersion: number;
  submittedAt: string | null;
  updatedAt: string;
  totals: EventBudgetTotals;
};

export type SponsorshipBenefitInput = {
  id: string;
  selected: boolean;
  explanation: string;
};

export type SponsorshipInput = {
  eventProposalId: string;
  sponsorName: string;
  sponsorContactName: string;
  sponsorEmail: string;
  sponsorPhone: string;
  sponsorWebsite: string;
  businessCategory: string;
  territory: string;
  stage: string;
  startDate: string;
  endDate: string;
  cashAmount: string;
  includesNoncash: boolean;
  noncashDescription: string;
  noncashQuantity: string;
  requestedNoncashValue: string;
  valueExplanation: string;
  deliveryDate: string;
  additionalNotes: string;
  benefits: SponsorshipBenefitInput[];
  acknowledgments: Record<string, boolean>;
};

function emptyAcknowledgments(list: readonly { name: string }[]) {
  return Object.fromEntries(list.map((item) => [item.name, false]));
}

function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function dateOnly(value: Date | string | null | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function computeTotalsFromInput(input: EventProposalInput) {
  const players = Number(input.estimatedPlayers || 0);
  const fee = input.recommendedEntryFee ? parseCents(input.recommendedEntryFee) : 0;
  const lines = input.items.map((item) => ({
    costType: item.costType,
    quantityHundredths: item.quantity ? parseQuantity(item.quantity) : 0,
    unitCents: item.unitCost ? parseCents(item.unitCost) : 0,
  }));
  return calculateEventBudget(players, fee, lines);
}

export async function recordPortalActivity(input: {
  entityType: string;
  entityId: string;
  activityType: string;
  previousValue?: string | null;
  newValue?: string | null;
  description: string;
  createdBy: string;
}) {
  await query(
    `insert into ctd_portal_activities (
      entity_type, entity_id, activity_type, previous_value, new_value, description, created_by
    ) values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.entityType,
      input.entityId,
      input.activityType,
      input.previousValue ?? null,
      input.newValue ?? null,
      input.description,
      input.createdBy,
    ],
  );
}

export async function addPortalNote(
  entityType: string,
  entityId: string,
  note: string,
  createdBy: string,
) {
  const trimmed = note.trim();
  if (!trimmed) throw new Error("Enter a note.");
  await query(
    `insert into ctd_portal_notes (entity_type, entity_id, note, created_by)
     values ($1, $2, $3, $4)`,
    [entityType, entityId, trimmed, createdBy],
  );
  await recordPortalActivity({
    entityType,
    entityId,
    activityType: "note_added",
    description: "Internal note added.",
    createdBy,
  });
}

export async function addPortalMessage(
  entityType: string,
  entityId: string,
  directorId: string,
  message: string,
  createdBy: string,
) {
  const trimmed = message.trim();
  if (!trimmed) throw new Error("Enter a message.");
  await query(
    `insert into ctd_portal_messages (
      entity_type, entity_id, director_id, message, created_by
    ) values ($1, $2, $3, $4, $5)`,
    [entityType, entityId, directorId, trimmed, createdBy],
  );
  await recordPortalActivity({
    entityType,
    entityId,
    activityType: "message_added",
    description: "Director-visible message added.",
    createdBy,
  });
}

export async function listPortalNotes(entityType: string, entityId: string) {
  const result = await query<{
    id: string;
    note: string;
    created_by: string;
    created_at: Date;
  }>(
    `select id, note, created_by, created_at
     from ctd_portal_notes
     where entity_type = $1 and entity_id = $2
     order by created_at desc`,
    [entityType, entityId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function listPortalMessages(entityType: string, entityId: string) {
  const result = await query<{
    id: string;
    message: string;
    created_by: string;
    created_at: Date;
  }>(
    `select id, message, created_by, created_at
     from ctd_portal_messages
     where entity_type = $1 and entity_id = $2
     order by created_at desc`,
    [entityType, entityId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    message: row.message,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function listPortalActivities(entityType: string, entityId: string) {
  const result = await query<{
    id: string;
    activity_type: string;
    previous_value: string | null;
    new_value: string | null;
    description: string;
    created_by: string;
    created_at: Date;
  }>(
    `select id, activity_type, previous_value, new_value, description, created_by, created_at
     from ctd_portal_activities
     where entity_type = $1 and entity_id = $2
     order by created_at desc`,
    [entityType, entityId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    activityType: row.activity_type,
    previousValue: row.previous_value,
    newValue: row.new_value,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function savePortalFile(input: {
  directorId: string;
  entityType: string;
  entityId: string;
  file: File | null;
}) {
  const parsed = await readFormFile(input.file);
  if (!parsed) return null;
  const digest = await crypto.subtle.digest("SHA-256", parsed.bytes);
  const sha256 = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const result = await query<{ id: string }>(
    `insert into ctd_portal_files (
      director_id, entity_type, entity_id, original_name, mime_type,
      size_bytes, sha256, data
    ) values ($1, $2, $3, $4, $5, $6, $7, $8)
    returning id`,
    [
      input.directorId,
      input.entityType,
      input.entityId,
      parsed.originalName,
      parsed.mimeType,
      parsed.sizeBytes,
      sha256,
      parsed.bytes,
    ],
  );
  await recordPortalActivity({
    entityType: input.entityType,
    entityId: input.entityId,
    activityType: "file_uploaded",
    description: `Uploaded ${parsed.originalName}.`,
    createdBy: input.directorId,
  });
  return result.rows[0].id;
}

export async function getPortalFile(id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const result = await query<{
    id: string;
    director_id: string;
    original_name: string;
    mime_type: string;
    data: Buffer;
  }>(
    `select id, director_id, original_name, mime_type, data
     from ctd_portal_files where id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listPortalFiles(entityType: string, entityId: string) {
  const result = await query<{
    id: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    created_at: Date;
  }>(
    `select id, original_name, mime_type, size_bytes, created_at
     from ctd_portal_files
     where entity_type = $1 and entity_id = $2
     order by created_at desc`,
    [entityType, entityId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at.toISOString(),
  }));
}

function mapEventRow(
  row: Record<string, unknown>,
  items: BudgetItemInput[],
  acknowledgments: Record<string, boolean>,
): EventProposalRecord {
  const input: EventProposalInput = {
    eventName: String(row.event_name ?? ""),
    sport: String(row.sport ?? ""),
    sportOther: String(row.sport_other ?? ""),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    postalCode: String(row.postal_code ?? ""),
    country: String(row.country ?? ""),
    facilityName: String(row.facility_name ?? ""),
    facilityContactName: String(row.facility_contact_name ?? ""),
    facilityContactEmail: String(row.facility_contact_email ?? ""),
    facilityContactPhone: String(row.facility_contact_phone ?? ""),
    primaryStartDate: dateOnly(row.primary_start_date as Date | string | null),
    primaryEndDate: dateOnly(row.primary_end_date as Date | string | null),
    alternateStartDate: dateOnly(row.alternate_start_date as Date | string | null),
    alternateEndDate: dateOnly(row.alternate_end_date as Date | string | null),
    courtCount: row.court_count == null ? "" : String(row.court_count),
    courtSetting: String(row.court_setting ?? ""),
    eventFormat: String(row.event_format ?? ""),
    divisions: String(row.divisions ?? ""),
    estimatedPlayers: String(row.estimated_players ?? "0"),
    recommendedEntryFee: ((Number(row.recommended_entry_fee_cents) || 0) / 100).toFixed(2),
    recommendedTeamFee: ((Number(row.recommended_team_fee_cents) || 0) / 100).toFixed(2),
    marketOpportunity: String(row.market_opportunity ?? ""),
    localRelationships: String(row.local_relationships ?? ""),
    competingEvents: String(row.competing_events ?? ""),
    facilityTerms: String(row.facility_terms ?? ""),
    additionalNotes: String(row.additional_notes ?? ""),
    overBudgetExplanation: String(row.over_budget_explanation ?? ""),
    acknowledgments,
    items,
  };

  return {
    ...input,
    id: String(row.id),
    directorId: String(row.director_id),
    currentStatus: isEventStatus(String(row.current_status))
      ? (row.current_status as EventStatus)
      : "draft",
    currentVersion: Number(row.current_version ?? 1),
    submittedAt: iso(row.submitted_at as Date | null),
    updatedAt: iso(row.updated_at as Date) ?? new Date().toISOString(),
    totals: computeTotalsFromInput(input),
  };
}

async function loadEventItems(proposalId: string) {
  const result = await query<{
    category: string;
    vendor: string;
    description: string;
    quantity_hundredths: number;
    unit_cents: number;
    cost_type: string;
    quote_reference: string;
    explanation: string;
  }>(
    `select category, vendor, description, quantity_hundredths, unit_cents,
            cost_type, quote_reference, explanation
     from ctd_event_budget_items
     where proposal_id = $1
     order by sort_order, created_at`,
    [proposalId],
  );
  return result.rows.map((row) => ({
    category: row.category,
    vendor: row.vendor,
    description: row.description,
    quantity: (row.quantity_hundredths / 100).toFixed(2),
    unitCost: (row.unit_cents / 100).toFixed(2),
    costType: row.cost_type === "per_player" ? "per_player" : "fixed",
    quoteReference: row.quote_reference,
    explanation: row.explanation,
  })) satisfies BudgetItemInput[];
}

async function loadEventAcks(proposalId: string) {
  const result = await query<{ name: string; acknowledged: boolean }>(
    `select name, acknowledged from ctd_event_acknowledgments where proposal_id = $1`,
    [proposalId],
  );
  const acks = emptyAcknowledgments(EVENT_ACKNOWLEDGMENTS);
  for (const row of result.rows) {
    acks[row.name] = row.acknowledged;
  }
  return acks;
}

export async function createEventDraft(director: DirectorRecord) {
  const result = await query<{ id: string }>(
    `insert into ctd_event_proposals (director_id, country)
     values ($1, 'United States')
     returning id`,
    [director.id],
  );
  await recordPortalActivity({
    entityType: "event",
    entityId: result.rows[0].id,
    activityType: "created",
    description: "Event proposal draft created.",
    createdBy: director.id,
  });
  return result.rows[0].id;
}

export async function getEventProposal(id: string, directorId?: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const result = await query<Record<string, unknown>>(
    `select * from ctd_event_proposals where id = $1${
      directorId ? " and director_id = $2" : ""
    }`,
    directorId ? [id, directorId] : [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  const [items, acknowledgments] = await Promise.all([
    loadEventItems(id),
    loadEventAcks(id),
  ]);
  return mapEventRow(row, items, acknowledgments);
}

export async function listEventProposals(filters: {
  directorId?: string;
  status?: string;
  search?: string;
}) {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  if (filters.directorId) {
    params.push(filters.directorId);
    conditions.push(`director_id = $${params.length}`);
  }
  if (filters.status && isEventStatus(filters.status)) {
    params.push(filters.status);
    conditions.push(`current_status = $${params.length}`);
  }
  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    conditions.push(
      `(lower(event_name) like $${params.length} or lower(city) like $${params.length} or lower(facility_name) like $${params.length})`,
    );
  }
  const result = await query<Record<string, unknown>>(
    `select * from ctd_event_proposals
     where ${conditions.join(" and ")}
     order by updated_at desc
     limit 200`,
    params,
  );
  return Promise.all(
    result.rows.map(async (row) => {
      const id = String(row.id);
      return mapEventRow(row, await loadEventItems(id), await loadEventAcks(id));
    }),
  );
}

async function replaceBudgetItems(proposalId: string, items: BudgetItemInput[]) {
  await query(`delete from ctd_event_budget_items where proposal_id = $1`, [
    proposalId,
  ]);
  for (const [index, item] of items.entries()) {
    await query(
      `insert into ctd_event_budget_items (
        proposal_id, sort_order, category, vendor, description,
        quantity_hundredths, unit_cents, cost_type, quote_reference, explanation
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        proposalId,
        index,
        item.category,
        item.vendor,
        item.description,
        item.quantity ? parseQuantity(item.quantity) : 0,
        item.unitCost ? parseCents(item.unitCost) : 0,
        item.costType,
        item.quoteReference,
        item.explanation,
      ],
    );
  }
}

async function replaceEventAcks(
  proposalId: string,
  acknowledgments: Record<string, boolean>,
) {
  for (const item of EVENT_ACKNOWLEDGMENTS) {
    await query(
      `insert into ctd_event_acknowledgments (proposal_id, name, acknowledged, acknowledged_at)
       values ($1, $2, $3, case when $3 then now() else null end)
       on conflict (proposal_id, name) do update
         set acknowledged = excluded.acknowledged,
             acknowledged_at = excluded.acknowledged_at`,
      [proposalId, item.name, Boolean(acknowledgments[item.name])],
    );
  }
}

export async function saveEventDraft(
  id: string,
  directorId: string,
  input: EventProposalInput,
) {
  const existing = await getEventProposal(id, directorId);
  if (!existing) throw new Error("That proposal was not found.");
  if (!directorCanEditEvent(existing.currentStatus)) {
    throw new Error("This proposal can no longer be edited.");
  }

  const totals = computeTotalsFromInput(input);
  await query(
    `update ctd_event_proposals set
      event_name=$2, sport=$3, sport_other=$4, address=$5, city=$6, state=$7,
      postal_code=$8, country=$9, facility_name=$10, facility_contact_name=$11,
      facility_contact_email=$12, facility_contact_phone=$13,
      primary_start_date=nullif($14,'')::date, primary_end_date=nullif($15,'')::date,
      alternate_start_date=nullif($16,'')::date, alternate_end_date=nullif($17,'')::date,
      court_count=nullif($18,'')::int, court_setting=$19, event_format=$20,
      divisions=$21, estimated_players=$22, recommended_entry_fee_cents=$23,
      recommended_team_fee_cents=$24, market_opportunity=$25, local_relationships=$26,
      competing_events=$27, facility_terms=$28, additional_notes=$29,
      over_budget=$30, over_budget_explanation=$31, updated_at=now()
     where id=$1 and director_id=$32`,
    [
      id,
      input.eventName,
      input.sport,
      input.sportOther,
      input.address,
      input.city,
      input.state,
      input.postalCode,
      input.country,
      input.facilityName,
      input.facilityContactName,
      input.facilityContactEmail,
      input.facilityContactPhone,
      input.primaryStartDate,
      input.primaryEndDate,
      input.alternateStartDate,
      input.alternateEndDate,
      input.courtCount,
      input.courtSetting,
      input.eventFormat,
      input.divisions,
      Number(input.estimatedPlayers || 0),
      input.recommendedEntryFee ? parseCents(input.recommendedEntryFee) : 0,
      input.recommendedTeamFee ? parseCents(input.recommendedTeamFee) : 0,
      input.marketOpportunity,
      input.localRelationships,
      input.competingEvents,
      input.facilityTerms,
      input.additionalNotes,
      totals.overBaseline,
      input.overBudgetExplanation,
      directorId,
    ],
  );
  await replaceBudgetItems(id, input.items);
  await replaceEventAcks(id, input.acknowledgments);
  return getEventProposal(id, directorId);
}

export function assertEventReadyToSubmit(
  input: EventProposalInput,
  totals: EventBudgetTotals,
) {
  if (!input.eventName.trim()) throw new Error("Enter a proposed event name.");
  if (!input.sport) throw new Error("Choose a sport.");
  if (input.sport === "other" && !input.sportOther.trim()) {
    throw new Error("Describe the other racquet sport.");
  }
  if (!input.city.trim() || !input.country.trim()) {
    throw new Error("Enter the event city and country.");
  }
  if (!input.primaryStartDate || !input.primaryEndDate) {
    throw new Error("Enter the proposed start and end dates.");
  }
  if (totals.estimatedPlayers < 1) throw new Error("Enter the estimated number of players.");
  if (totals.overBaseline && !input.overBudgetExplanation.trim()) {
    throw new Error(
      "Proposed expenses exceed $65 per projected player. Enter an explanation before submitting.",
    );
  }
  for (const item of EVENT_ACKNOWLEDGMENTS) {
    if (!input.acknowledgments[item.name]) {
      throw new Error("Confirm every acknowledgment before submitting.");
    }
  }
}

export async function submitEventProposal(id: string, directorId: string) {
  const existing = await getEventProposal(id, directorId);
  if (!existing) throw new Error("That proposal was not found.");
  if (!directorCanEditEvent(existing.currentStatus)) {
    throw new Error("This proposal cannot be submitted in its current status.");
  }
  assertEventReadyToSubmit(existing, existing.totals);

  const version = existing.currentVersion;
  await query(
    `insert into ctd_event_proposal_versions (proposal_id, version_number, snapshot, created_by)
     values ($1, $2, $3::jsonb, $4)`,
    [id, version, JSON.stringify(existing), directorId],
  );
  await query(
    `update ctd_event_proposals
     set current_status = 'submitted',
         submitted_at = now(),
         current_version = $2,
         updated_at = now()
     where id = $1`,
    [id, version + 1],
  );
  await recordPortalActivity({
    entityType: "event",
    entityId: id,
    activityType: "submitted",
    previousValue: existing.currentStatus,
    newValue: "submitted",
    description: "Event proposal submitted.",
    createdBy: directorId,
  });
  return getEventProposal(id, directorId);
}

export async function withdrawEventProposal(id: string, directorId: string) {
  const existing = await getEventProposal(id, directorId);
  if (!existing) throw new Error("That proposal was not found.");
  if (!directorCanWithdrawEvent(existing.currentStatus)) {
    throw new Error("This proposal can no longer be withdrawn.");
  }
  await query(
    `update ctd_event_proposals
     set current_status = 'withdrawn', updated_at = now()
     where id = $1 and director_id = $2`,
    [id, directorId],
  );
  await recordPortalActivity({
    entityType: "event",
    entityId: id,
    activityType: "status_changed",
    previousValue: existing.currentStatus,
    newValue: "withdrawn",
    description: "Director withdrew the proposal.",
    createdBy: directorId,
  });
}

export async function copyEventProposal(id: string, directorId: string) {
  const existing = await getEventProposal(id, directorId);
  if (!existing) throw new Error("That proposal was not found.");
  const draftId = await createEventDraft({
    id: directorId,
    applicationId: null,
    email: "",
    firstName: "",
    lastName: "",
    status: "active",
  });
  await saveEventDraft(draftId, directorId, {
    ...existing,
    eventName: existing.eventName ? `${existing.eventName} (copy)` : "",
    acknowledgments: emptyAcknowledgments(EVENT_ACKNOWLEDGMENTS),
  });
  return draftId;
}

export async function adminSetEventStatus(
  id: string,
  next: EventStatus,
  actor: string,
  message?: string,
) {
  const existing = await getEventProposal(id);
  if (!existing) throw new Error("That proposal was not found.");
  if (existing.currentStatus === next) return existing;
  if (
    isAdminOnlyEventStatus(next) === false &&
    next !== "needs_information" &&
    next !== "under_review"
  ) {
    throw new Error("That status change is not allowed.");
  }
  await query(
    `update ctd_event_proposals
     set current_status = $2, updated_at = now()
     where id = $1`,
    [id, next],
  );
  await recordPortalActivity({
    entityType: "event",
    entityId: id,
    activityType: "status_changed",
    previousValue: existing.currentStatus,
    newValue: next,
    description: message?.trim() || `Status changed to ${next}.`,
    createdBy: actor,
  });
  return getEventProposal(id);
}

export async function authorizeEventProposal(
  id: string,
  input: { specialConditions: string },
) {
  const existing = await getEventProposal(id);
  if (!existing) throw new Error("That proposal was not found.");
  const dates = [existing.primaryStartDate, existing.primaryEndDate]
    .filter(Boolean)
    .join(" to ");
  const reference = newReference("RW-AUTH");
  await query(
    `insert into ctd_event_authorizations (
      proposal_id, reference_number, authorized_event_name, facility,
      approved_dates, approved_sport_format, approved_budget_cents,
      approved_expense_per_player_cents, special_conditions, authorized_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    on conflict (proposal_id) do update set
      reference_number = excluded.reference_number,
      authorized_event_name = excluded.authorized_event_name,
      facility = excluded.facility,
      approved_dates = excluded.approved_dates,
      approved_sport_format = excluded.approved_sport_format,
      approved_budget_cents = excluded.approved_budget_cents,
      approved_expense_per_player_cents = excluded.approved_expense_per_player_cents,
      special_conditions = excluded.special_conditions,
      authorized_by = excluded.authorized_by,
      authorized_at = now()`,
    [
      id,
      reference,
      existing.eventName,
      existing.facilityName,
      dates,
      `${existing.sport} / ${existing.eventFormat}`,
      existing.totals.totalExpensesCents,
      existing.totals.expensePerPlayerCents,
      input.specialConditions,
      WORKFLOW_ACTOR,
    ],
  );
  await adminSetEventStatus(id, "authorized", WORKFLOW_ACTOR, "Event authorized.");
  return getEventAuthorization(id);
}

export async function getEventAuthorization(proposalId: string) {
  const result = await query<{
    reference_number: string;
    authorized_event_name: string;
    facility: string;
    approved_dates: string;
    approved_sport_format: string;
    approved_budget_cents: number;
    approved_expense_per_player_cents: number;
    special_conditions: string;
    authorized_by: string;
    authorized_at: Date;
  }>(
    `select reference_number, authorized_event_name, facility, approved_dates,
            approved_sport_format, approved_budget_cents,
            approved_expense_per_player_cents, special_conditions,
            authorized_by, authorized_at
     from ctd_event_authorizations where proposal_id = $1`,
    [proposalId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    referenceNumber: row.reference_number,
    eventName: row.authorized_event_name,
    facility: row.facility,
    dates: row.approved_dates,
    sportFormat: row.approved_sport_format,
    budgetCents: row.approved_budget_cents,
    expensePerPlayerCents: row.approved_expense_per_player_cents,
    specialConditions: row.special_conditions,
    authorizedBy: row.authorized_by,
    authorizedAt: row.authorized_at.toISOString(),
  };
}

export async function listEventVersions(proposalId: string) {
  const result = await query<{
    version_number: number;
    created_at: Date;
    created_by: string;
  }>(
    `select version_number, created_at, created_by
     from ctd_event_proposal_versions
     where proposal_id = $1
     order by version_number desc`,
    [proposalId],
  );
  return result.rows.map((row) => ({
    version: row.version_number,
    createdAt: row.created_at.toISOString(),
    createdBy: row.created_by,
  }));
}

export async function createSponsorshipDraft(directorId: string) {
  const result = await query<{ id: string }>(
    `insert into ctd_sponsorship_requests (director_id) values ($1) returning id`,
    [directorId],
  );
  await recordPortalActivity({
    entityType: "sponsorship",
    entityId: result.rows[0].id,
    activityType: "created",
    description: "Sponsorship request draft created.",
    createdBy: directorId,
  });
  return result.rows[0].id;
}

function mapSponsorship(row: Record<string, unknown>): SponsorshipInput & {
  id: string;
  directorId: string;
  currentStatus: SponsorshipStatus;
  currentVersion: number;
  submittedAt: string | null;
  updatedAt: string;
} {
  return {
    id: String(row.id),
    directorId: String(row.director_id),
    currentStatus: isSponsorshipStatus(String(row.current_status))
      ? (row.current_status as SponsorshipStatus)
      : "draft",
    currentVersion: Number(row.current_version ?? 1),
    submittedAt: iso(row.submitted_at as Date | null),
    updatedAt: iso(row.updated_at as Date) ?? new Date().toISOString(),
    eventProposalId: String(row.event_proposal_id ?? ""),
    sponsorName: String(row.sponsor_name ?? ""),
    sponsorContactName: String(row.sponsor_contact_name ?? ""),
    sponsorEmail: String(row.sponsor_email ?? ""),
    sponsorPhone: String(row.sponsor_phone ?? ""),
    sponsorWebsite: String(row.sponsor_website ?? ""),
    businessCategory: String(row.business_category ?? ""),
    territory: String(row.territory ?? ""),
    stage: String(row.stage ?? ""),
    startDate: dateOnly(row.start_date as Date | string | null),
    endDate: dateOnly(row.end_date as Date | string | null),
    cashAmount: ((Number(row.cash_cents) || 0) / 100).toFixed(2),
    includesNoncash: Boolean(row.includes_noncash),
    noncashDescription: String(row.noncash_description ?? ""),
    noncashQuantity: String(row.noncash_quantity ?? ""),
    requestedNoncashValue: ((Number(row.requested_noncash_cents) || 0) / 100).toFixed(2),
    valueExplanation: String(row.value_explanation ?? ""),
    deliveryDate: dateOnly(row.delivery_date as Date | string | null),
    additionalNotes: String(row.additional_notes ?? ""),
    benefits: Array.isArray(row.requested_benefits)
      ? (row.requested_benefits as SponsorshipBenefitInput[])
      : [],
    acknowledgments: {},
  };
}

async function loadSponsorAcks(id: string) {
  const result = await query<{ name: string; acknowledged: boolean }>(
    `select name, acknowledged from ctd_sponsorship_acknowledgments where request_id = $1`,
    [id],
  );
  const acks = emptyAcknowledgments(SPONSORSHIP_ACKNOWLEDGMENTS);
  for (const row of result.rows) acks[row.name] = row.acknowledged;
  return acks;
}

export async function getSponsorship(id: string, directorId?: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const result = await query<Record<string, unknown>>(
    `select * from ctd_sponsorship_requests where id = $1${
      directorId ? " and director_id = $2" : ""
    }`,
    directorId ? [id, directorId] : [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { ...mapSponsorship(row), acknowledgments: await loadSponsorAcks(id) };
}

export async function listSponsorships(filters: {
  directorId?: string;
  status?: string;
  search?: string;
}) {
  const conditions = ["1=1"];
  const params: unknown[] = [];
  if (filters.directorId) {
    params.push(filters.directorId);
    conditions.push(`director_id = $${params.length}`);
  }
  if (filters.status && isSponsorshipStatus(filters.status)) {
    params.push(filters.status);
    conditions.push(`current_status = $${params.length}`);
  }
  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    conditions.push(
      `(lower(sponsor_name) like $${params.length} or lower(territory) like $${params.length})`,
    );
  }
  const result = await query<Record<string, unknown>>(
    `select * from ctd_sponsorship_requests
     where ${conditions.join(" and ")}
     order by updated_at desc
     limit 200`,
    params,
  );
  return Promise.all(
    result.rows.map(async (row) => ({
      ...mapSponsorship(row),
      acknowledgments: await loadSponsorAcks(String(row.id)),
    })),
  );
}

export async function saveSponsorshipDraft(
  id: string,
  directorId: string,
  input: SponsorshipInput,
) {
  const existing = await getSponsorship(id, directorId);
  if (!existing) throw new Error("That sponsorship request was not found.");
  if (!directorCanEditSponsorship(existing.currentStatus)) {
    throw new Error("This request can no longer be edited.");
  }
  await query(
    `update ctd_sponsorship_requests set
      event_proposal_id = nullif($2,'')::uuid,
      sponsor_name=$3, sponsor_contact_name=$4, sponsor_email=$5, sponsor_phone=$6,
      sponsor_website=$7, business_category=$8, territory=$9, stage=$10,
      start_date=nullif($11,'')::date, end_date=nullif($12,'')::date,
      cash_cents=$13, includes_noncash=$14, noncash_description=$15,
      noncash_quantity=$16, requested_noncash_cents=$17, value_explanation=$18,
      delivery_date=nullif($19,'')::date, additional_notes=$20,
      requested_benefits=$21::jsonb, updated_at=now()
     where id=$1 and director_id=$22`,
    [
      id,
      input.eventProposalId,
      input.sponsorName,
      input.sponsorContactName,
      input.sponsorEmail,
      input.sponsorPhone,
      input.sponsorWebsite,
      input.businessCategory,
      input.territory,
      input.stage,
      input.startDate,
      input.endDate,
      input.cashAmount ? parseCents(input.cashAmount) : 0,
      input.includesNoncash,
      input.noncashDescription,
      input.noncashQuantity,
      input.requestedNoncashValue ? parseCents(input.requestedNoncashValue) : 0,
      input.valueExplanation,
      input.deliveryDate,
      input.additionalNotes,
      JSON.stringify(input.benefits),
      directorId,
    ],
  );
  for (const item of SPONSORSHIP_ACKNOWLEDGMENTS) {
    await query(
      `insert into ctd_sponsorship_acknowledgments (request_id, name, acknowledged, acknowledged_at)
       values ($1,$2,$3, case when $3 then now() else null end)
       on conflict (request_id, name) do update
         set acknowledged = excluded.acknowledged,
             acknowledged_at = excluded.acknowledged_at`,
      [id, item.name, Boolean(input.acknowledgments[item.name])],
    );
  }
  return getSponsorship(id, directorId);
}

export function assertSponsorshipReady(input: SponsorshipInput) {
  if (!input.sponsorName.trim()) throw new Error("Enter the sponsor name.");
  for (const item of SPONSORSHIP_ACKNOWLEDGMENTS) {
    if (!input.acknowledgments[item.name]) {
      throw new Error("Confirm every acknowledgment before submitting.");
    }
  }
}

export async function submitSponsorship(id: string, directorId: string) {
  const existing = await getSponsorship(id, directorId);
  if (!existing) throw new Error("That sponsorship request was not found.");
  if (!directorCanEditSponsorship(existing.currentStatus)) {
    throw new Error("This request cannot be submitted in its current status.");
  }
  assertSponsorshipReady(existing);
  await query(
    `insert into ctd_sponsorship_versions (request_id, version_number, snapshot, created_by)
     values ($1,$2,$3::jsonb,$4)`,
    [id, existing.currentVersion, JSON.stringify(existing), directorId],
  );
  await query(
    `update ctd_sponsorship_requests
     set current_status='submitted', submitted_at=now(),
         current_version=$2, updated_at=now()
     where id=$1`,
    [id, existing.currentVersion + 1],
  );
  await recordPortalActivity({
    entityType: "sponsorship",
    entityId: id,
    activityType: "submitted",
    previousValue: existing.currentStatus,
    newValue: "submitted",
    description: "Sponsorship request submitted.",
    createdBy: directorId,
  });
  return getSponsorship(id, directorId);
}

export async function withdrawSponsorship(id: string, directorId: string) {
  const existing = await getSponsorship(id, directorId);
  if (!existing) throw new Error("That sponsorship request was not found.");
  if (!directorCanWithdrawSponsorship(existing.currentStatus)) {
    throw new Error("This request can no longer be withdrawn.");
  }
  await query(
    `update ctd_sponsorship_requests
     set current_status='withdrawn', updated_at=now()
     where id=$1 and director_id=$2`,
    [id, directorId],
  );
  await recordPortalActivity({
    entityType: "sponsorship",
    entityId: id,
    activityType: "status_changed",
    previousValue: existing.currentStatus,
    newValue: "withdrawn",
    description: "Director withdrew the sponsorship request.",
    createdBy: directorId,
  });
}

export async function adminSetSponsorshipStatus(
  id: string,
  next: SponsorshipStatus,
  actor: string,
  message?: string,
) {
  const existing = await getSponsorship(id);
  if (!existing) throw new Error("That sponsorship request was not found.");
  if (
    !isAdminOnlySponsorshipStatus(next) &&
    next !== "needs_information" &&
    next !== "under_review"
  ) {
    throw new Error("That status change is not allowed.");
  }
  await query(
    `update ctd_sponsorship_requests
     set current_status=$2, updated_at=now()
     where id=$1`,
    [id, next],
  );
  await recordPortalActivity({
    entityType: "sponsorship",
    entityId: id,
    activityType: "status_changed",
    previousValue: existing.currentStatus,
    newValue: next,
    description: message?.trim() || `Status changed to ${next}.`,
    createdBy: actor,
  });
  return getSponsorship(id);
}

export async function approveSponsorship(
  id: string,
  input: {
    approvedCash: string;
    approvedNoncash: string;
    approvedBenefits: string;
    approvedPeriod: string;
    categoryRestrictions: string;
    noncashTreatment: string;
    conditions: string;
    withConditions: boolean;
  },
) {
  const existing = await getSponsorship(id);
  if (!existing) throw new Error("That sponsorship request was not found.");
  const cash = parseCents(input.approvedCash || existing.cashAmount);
  const noncash = parseCents(input.approvedNoncash || "0");
  const reference = newReference("RW-SPN");
  await query(
    `insert into ctd_sponsorship_approvals (
      request_id, reference_number, approved_sponsor, associated_event_or_market,
      approved_cash_cents, approved_noncash_cents, approved_benefits,
      approved_period, category_restrictions, noncash_treatment, conditions, approved_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    on conflict (request_id) do update set
      reference_number=excluded.reference_number,
      approved_sponsor=excluded.approved_sponsor,
      associated_event_or_market=excluded.associated_event_or_market,
      approved_cash_cents=excluded.approved_cash_cents,
      approved_noncash_cents=excluded.approved_noncash_cents,
      approved_benefits=excluded.approved_benefits,
      approved_period=excluded.approved_period,
      category_restrictions=excluded.category_restrictions,
      noncash_treatment=excluded.noncash_treatment,
      conditions=excluded.conditions,
      approved_by=excluded.approved_by,
      approved_at=now()`,
    [
      id,
      reference,
      existing.sponsorName,
      existing.territory || existing.eventProposalId,
      cash,
      noncash,
      input.approvedBenefits,
      input.approvedPeriod,
      input.categoryRestrictions,
      input.noncashTreatment,
      input.conditions,
      WORKFLOW_ACTOR,
    ],
  );
  await adminSetSponsorshipStatus(
    id,
    input.withConditions ? "approved_with_conditions" : "approved",
    WORKFLOW_ACTOR,
    "Sponsorship approved.",
  );
  return getSponsorshipApproval(id);
}

export async function getSponsorshipApproval(id: string) {
  const result = await query<{
    reference_number: string;
    approved_sponsor: string;
    associated_event_or_market: string;
    approved_cash_cents: number;
    approved_noncash_cents: number;
    approved_benefits: string;
    approved_period: string;
    category_restrictions: string;
    noncash_treatment: string;
    conditions: string;
    approved_by: string;
    approved_at: Date;
  }>(
    `select * from ctd_sponsorship_approvals where request_id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  const split = calculateSponsorshipSplit(
    row.approved_cash_cents,
    row.approved_noncash_cents,
  );
  return {
    referenceNumber: row.reference_number,
    sponsor: row.approved_sponsor,
    eventOrMarket: row.associated_event_or_market,
    ...split,
    approvedBenefits: row.approved_benefits,
    approvedPeriod: row.approved_period,
    categoryRestrictions: row.category_restrictions,
    noncashTreatment: row.noncash_treatment,
    conditions: row.conditions,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at.toISOString(),
  };
}

export async function getPortalDashboardCounts() {
  const events = await query<{ current_status: string; count: string }>(
    `select current_status, count(*)::text as count
     from ctd_event_proposals group by current_status`,
  );
  const sponsors = await query<{ current_status: string; count: string }>(
    `select current_status, count(*)::text as count
     from ctd_sponsorship_requests group by current_status`,
  );
  const count = (
    rows: { current_status: string; count: string }[],
    ...statuses: string[]
  ) =>
    rows
      .filter((row) => statuses.includes(row.current_status))
      .reduce((sum, row) => sum + Number(row.count), 0);

  return {
    eventsAwaitingReview: count(events.rows, "submitted", "under_review"),
    eventsNeedsInformation: count(events.rows, "needs_information"),
    eventsAuthorized: count(events.rows, "authorized"),
    sponsorshipsAwaitingReview: count(sponsors.rows, "submitted", "under_review"),
    sponsorshipsNeedsInformation: count(sponsors.rows, "needs_information"),
    sponsorshipsApproved: count(
      sponsors.rows,
      "approved",
      "approved_with_conditions",
    ),
  };
}

const ADMIN_PAGE_SIZE = 25;

export const EVENT_OPEN_STATUSES = [
  "submitted",
  "needs_information",
  "under_review",
  "approved_authorization_pending",
] as const;

export const SPONSORSHIP_OPEN_STATUSES = [
  "submitted",
  "needs_information",
  "under_review",
] as const;

export type AdminPortalListFilters = {
  directorId?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  market?: string;
  sort?: string;
  page?: number;
};

export async function listAdminEventProposals(filters: AdminPortalListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const conditions = ["1=1"];
  const params: unknown[] = [];
  if (filters.directorId && UUID_PATTERN.test(filters.directorId)) {
    params.push(filters.directorId);
    conditions.push(`e.director_id = $${params.length}`);
  }
  if (filters.status && isEventStatus(filters.status)) {
    params.push(filters.status);
    conditions.push(`e.current_status = $${params.length}`);
  }
  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    conditions.push(
      `(lower(e.event_name) like $${params.length} or lower(e.city) like $${params.length} or lower(e.facility_name) like $${params.length} or lower(d.email) like $${params.length} or lower(d.first_name || ' ' || d.last_name) like $${params.length})`,
    );
  }
  if (filters.market?.trim()) {
    params.push(`%${filters.market.trim().toLowerCase()}%`);
    conditions.push(
      `(lower(e.city) like $${params.length} or lower(e.state) like $${params.length} or lower(e.facility_name) like $${params.length})`,
    );
  }
  if (filters.dateFrom) {
    params.push(filters.dateFrom);
    conditions.push(`coalesce(e.submitted_at, e.created_at)::date >= $${params.length}::date`);
  }
  if (filters.dateTo) {
    params.push(filters.dateTo);
    conditions.push(`coalesce(e.submitted_at, e.created_at)::date <= $${params.length}::date`);
  }

  const order =
    filters.sort === "submitted"
      ? "e.submitted_at desc nulls last"
      : filters.sort === "name"
        ? "e.event_name asc"
        : "e.updated_at desc";

  const count = await query<{ count: string }>(
    `select count(*)::text as count
     from ctd_event_proposals e
     join ctd_directors d on d.id = e.director_id
     where ${conditions.join(" and ")}`,
    params,
  );
  const total = Number(count.rows[0]?.count ?? 0);
  params.push(ADMIN_PAGE_SIZE, (page - 1) * ADMIN_PAGE_SIZE);
  const result = await query<Record<string, unknown>>(
    `select e.id, e.event_name, e.city, e.state, e.current_status, e.over_budget,
            e.submitted_at, e.updated_at, e.director_id,
            d.first_name, d.last_name, d.email
     from ctd_event_proposals e
     join ctd_directors d on d.id = e.director_id
     where ${conditions.join(" and ")}
     order by ${order}
     limit $${params.length - 1} offset $${params.length}`,
    params,
  );

  return {
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    rows: result.rows.map((row) => ({
      id: String(row.id),
      eventName: String(row.event_name || "Untitled proposal"),
      city: String(row.city ?? ""),
      state: String(row.state ?? ""),
      status: isEventStatus(String(row.current_status))
        ? (row.current_status as EventStatus)
        : "draft",
      overBudget: Boolean(row.over_budget),
      openAction: EVENT_OPEN_STATUSES.includes(
        String(row.current_status) as (typeof EVENT_OPEN_STATUSES)[number],
      ),
      submittedAt: iso(row.submitted_at as Date | null),
      updatedAt: iso(row.updated_at as Date) ?? new Date().toISOString(),
      directorId: String(row.director_id),
      directorName: `${row.first_name} ${row.last_name}`.trim(),
      directorEmail: String(row.email),
    })),
  };
}

export async function listAdminSponsorships(filters: AdminPortalListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const conditions = ["1=1"];
  const params: unknown[] = [];
  if (filters.directorId && UUID_PATTERN.test(filters.directorId)) {
    params.push(filters.directorId);
    conditions.push(`s.director_id = $${params.length}`);
  }
  if (filters.status && isSponsorshipStatus(filters.status)) {
    params.push(filters.status);
    conditions.push(`s.current_status = $${params.length}`);
  }
  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    conditions.push(
      `(lower(s.sponsor_name) like $${params.length} or lower(s.territory) like $${params.length} or lower(d.email) like $${params.length} or lower(d.first_name || ' ' || d.last_name) like $${params.length})`,
    );
  }
  if (filters.market?.trim()) {
    params.push(`%${filters.market.trim().toLowerCase()}%`);
    conditions.push(
      `(lower(s.territory) like $${params.length} or lower(coalesce(e.event_name,'')) like $${params.length})`,
    );
  }
  if (filters.dateFrom) {
    params.push(filters.dateFrom);
    conditions.push(`coalesce(s.submitted_at, s.created_at)::date >= $${params.length}::date`);
  }
  if (filters.dateTo) {
    params.push(filters.dateTo);
    conditions.push(`coalesce(s.submitted_at, s.created_at)::date <= $${params.length}::date`);
  }

  const order =
    filters.sort === "submitted"
      ? "s.submitted_at desc nulls last"
      : filters.sort === "name"
        ? "s.sponsor_name asc"
        : "s.updated_at desc";

  const count = await query<{ count: string }>(
    `select count(*)::text as count
     from ctd_sponsorship_requests s
     join ctd_directors d on d.id = s.director_id
     left join ctd_event_proposals e on e.id = s.event_proposal_id
     where ${conditions.join(" and ")}`,
    params,
  );
  const total = Number(count.rows[0]?.count ?? 0);
  params.push(ADMIN_PAGE_SIZE, (page - 1) * ADMIN_PAGE_SIZE);
  const result = await query<Record<string, unknown>>(
    `select s.id, s.sponsor_name, s.territory, s.current_status, s.submitted_at,
            s.updated_at, s.director_id, s.event_proposal_id, e.event_name,
            d.first_name, d.last_name, d.email
     from ctd_sponsorship_requests s
     join ctd_directors d on d.id = s.director_id
     left join ctd_event_proposals e on e.id = s.event_proposal_id
     where ${conditions.join(" and ")}
     order by ${order}
     limit $${params.length - 1} offset $${params.length}`,
    params,
  );

  return {
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    rows: result.rows.map((row) => ({
      id: String(row.id),
      sponsorName: String(row.sponsor_name || "Untitled request"),
      territory: String(row.territory ?? ""),
      eventName: String(row.event_name ?? ""),
      status: isSponsorshipStatus(String(row.current_status))
        ? (row.current_status as SponsorshipStatus)
        : "draft",
      openAction: SPONSORSHIP_OPEN_STATUSES.includes(
        String(row.current_status) as (typeof SPONSORSHIP_OPEN_STATUSES)[number],
      ),
      submittedAt: iso(row.submitted_at as Date | null),
      updatedAt: iso(row.updated_at as Date) ?? new Date().toISOString(),
      directorId: String(row.director_id),
      directorName: `${row.first_name} ${row.last_name}`.trim(),
      directorEmail: String(row.email),
    })),
  };
}

export function parseEventForm(formData: FormData): EventProposalInput {
  let items: BudgetItemInput[] = [];
  const rawItems = String(formData.get("budgetJson") ?? "");
  if (rawItems) {
    try {
      items = JSON.parse(rawItems) as BudgetItemInput[];
    } catch {
      items = [];
    }
  }
  const acknowledgments = Object.fromEntries(
    EVENT_ACKNOWLEDGMENTS.map((item) => [
      item.name,
      formData.get(item.name) === "on" || formData.get(item.name) === "1",
    ]),
  );
  return {
    eventName: String(formData.get("eventName") ?? ""),
    sport: String(formData.get("sport") ?? ""),
    sportOther: String(formData.get("sportOther") ?? ""),
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    country: String(formData.get("country") ?? ""),
    facilityName: String(formData.get("facilityName") ?? ""),
    facilityContactName: String(formData.get("facilityContactName") ?? ""),
    facilityContactEmail: String(formData.get("facilityContactEmail") ?? ""),
    facilityContactPhone: String(formData.get("facilityContactPhone") ?? ""),
    primaryStartDate: String(formData.get("primaryStartDate") ?? ""),
    primaryEndDate: String(formData.get("primaryEndDate") ?? ""),
    alternateStartDate: String(formData.get("alternateStartDate") ?? ""),
    alternateEndDate: String(formData.get("alternateEndDate") ?? ""),
    courtCount: String(formData.get("courtCount") ?? ""),
    courtSetting: String(formData.get("courtSetting") ?? ""),
    eventFormat: String(formData.get("eventFormat") ?? ""),
    divisions: String(formData.get("divisions") ?? ""),
    estimatedPlayers: String(formData.get("estimatedPlayers") ?? ""),
    recommendedEntryFee: String(formData.get("recommendedEntryFee") ?? ""),
    recommendedTeamFee: String(formData.get("recommendedTeamFee") ?? ""),
    marketOpportunity: String(formData.get("marketOpportunity") ?? ""),
    localRelationships: String(formData.get("localRelationships") ?? ""),
    competingEvents: String(formData.get("competingEvents") ?? ""),
    facilityTerms: String(formData.get("facilityTerms") ?? ""),
    additionalNotes: String(formData.get("additionalNotes") ?? ""),
    overBudgetExplanation: String(formData.get("overBudgetExplanation") ?? ""),
    acknowledgments,
    items,
  };
}

export function parseSponsorshipForm(formData: FormData): SponsorshipInput {
  let benefits: SponsorshipBenefitInput[] = [];
  const raw = String(formData.get("benefitsJson") ?? "");
  if (raw) {
    try {
      benefits = JSON.parse(raw) as SponsorshipBenefitInput[];
    } catch {
      benefits = [];
    }
  }
  return {
    eventProposalId: String(formData.get("eventProposalId") ?? ""),
    sponsorName: String(formData.get("sponsorName") ?? ""),
    sponsorContactName: String(formData.get("sponsorContactName") ?? ""),
    sponsorEmail: String(formData.get("sponsorEmail") ?? ""),
    sponsorPhone: String(formData.get("sponsorPhone") ?? ""),
    sponsorWebsite: String(formData.get("sponsorWebsite") ?? ""),
    businessCategory: String(formData.get("businessCategory") ?? ""),
    territory: String(formData.get("territory") ?? ""),
    stage: String(formData.get("stage") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    cashAmount: String(formData.get("cashAmount") ?? ""),
    includesNoncash: formData.get("includesNoncash") === "on",
    noncashDescription: String(formData.get("noncashDescription") ?? ""),
    noncashQuantity: String(formData.get("noncashQuantity") ?? ""),
    requestedNoncashValue: String(formData.get("requestedNoncashValue") ?? ""),
    valueExplanation: String(formData.get("valueExplanation") ?? ""),
    deliveryDate: String(formData.get("deliveryDate") ?? ""),
    additionalNotes: String(formData.get("additionalNotes") ?? ""),
    benefits,
    acknowledgments: Object.fromEntries(
      SPONSORSHIP_ACKNOWLEDGMENTS.map((item) => [
        item.name,
        formData.get(item.name) === "on" || formData.get(item.name) === "1",
      ]),
    ),
  };
}
