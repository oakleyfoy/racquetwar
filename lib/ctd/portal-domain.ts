export const EVENT_STATUSES = [
  "draft",
  "submitted",
  "needs_information",
  "under_review",
  "approved_authorization_pending",
  "authorized",
  "declined",
  "withdrawn",
  "cancelled",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  needs_information: "Needs Information",
  under_review: "Under Review",
  approved_authorization_pending: "Approved — Authorization Pending",
  authorized: "Authorized",
  declined: "Declined",
  withdrawn: "Withdrawn",
  cancelled: "Cancelled",
};

export const ADMIN_ONLY_EVENT_STATUSES = [
  "approved_authorization_pending",
  "authorized",
  "declined",
  "cancelled",
] as const;

export const EVENT_SPORTS = [
  "tennis",
  "pickleball",
  "padel",
  "other",
] as const;

export const EVENT_SPORT_LABELS: Record<(typeof EVENT_SPORTS)[number], string> = {
  tennis: "Tennis",
  pickleball: "Pickleball",
  padel: "Padel",
  other: "Other racquet sport",
};

export const COURT_SETTINGS = ["indoor", "outdoor", "combination"] as const;

export const EXPENSE_CATEGORIES = [
  "facility_court",
  "balls_supplies",
  "awards",
  "player_food",
  "player_gifts",
  "officials_staff",
  "local_marketing",
  "equipment_rentals",
  "director_travel",
  "other",
] as const;

export const EXPENSE_CATEGORY_LABELS: Record<
  (typeof EXPENSE_CATEGORIES)[number],
  string
> = {
  facility_court: "Facility and court costs",
  balls_supplies: "Balls and playing supplies",
  awards: "Awards and trophies",
  player_food: "Player food and beverages",
  player_gifts: "Player gifts and amenities",
  officials_staff: "Officials and approved event staff",
  local_marketing: "Local marketing",
  equipment_rentals: "Equipment and rentals",
  director_travel: "Approved Director travel",
  other: "Other proposed expense",
};

export const EVENT_ACKNOWLEDGMENTS = [
  {
    name: "noCommitment",
    label:
      "I have not committed War Tournaments LLC or Racquet War to this facility, vendor, expense or event.",
  },
  {
    name: "writtenApproval",
    label:
      "I understand that War Tournaments LLC must approve this event and its budget in writing.",
  },
  {
    name: "noOperate",
    label:
      "I understand that submitting this proposal does not authorize me to announce, market, register players for, collect money for or operate this event.",
  },
  {
    name: "materialChanges",
    label:
      "I understand that material changes to an approved event or budget require additional written approval.",
  },
  {
    name: "registrationOwned",
    label:
      "I understand that War Tournaments LLC owns and administers registration, payment processing, refunds, registration records and official financial reporting.",
  },
] as const;

export const PRICING_NOTICE =
  "Entry fees are recommendations only. War Tournaments LLC determines final registration pricing and owns registration setup, payment processing, refund processing, registration records and official financial reporting.";

export const BUDGET_DISCLAIMER =
  "These figures are planning estimates only. Actual compensation is determined from eligible-player revenue, the RW fee, approved expenses, complimentary-player allocations, refunds, transfers, disputes, chargebacks and other permitted adjustments shown in War Tournaments’ official event closeout.";

export const SPONSORSHIP_STATUSES = [
  "draft",
  "submitted",
  "needs_information",
  "under_review",
  "approved",
  "approved_with_conditions",
  "declined",
  "withdrawn",
  "expired",
] as const;

export type SponsorshipStatus = (typeof SPONSORSHIP_STATUSES)[number];

export const SPONSORSHIP_STATUS_LABELS: Record<SponsorshipStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  needs_information: "Needs Information",
  under_review: "Under Review",
  approved: "Approved",
  approved_with_conditions: "Approved With Conditions",
  declined: "Declined",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

export const ADMIN_ONLY_SPONSORSHIP_STATUSES = [
  "approved",
  "approved_with_conditions",
  "declined",
  "expired",
] as const;

export const SPONSORSHIP_STAGES = [
  "lead_identified",
  "initial_conversation",
  "sponsor_interested",
  "verbal_offer",
  "written_proposal",
] as const;

export const SPONSORSHIP_STAGE_LABELS: Record<
  (typeof SPONSORSHIP_STAGES)[number],
  string
> = {
  lead_identified: "Lead identified",
  initial_conversation: "Initial conversation",
  sponsor_interested: "Sponsor interested",
  verbal_offer: "Verbal offer received",
  written_proposal: "Written proposal received",
};

export const SPONSOR_BENEFITS = [
  "logo_placement",
  "event_signage",
  "vendor_table",
  "social_media",
  "email_recognition",
  "player_gifts",
  "naming_rights",
  "category_exclusivity",
  "product_distribution",
  "other",
] as const;

export const SPONSOR_BENEFIT_LABELS: Record<
  (typeof SPONSOR_BENEFITS)[number],
  string
> = {
  logo_placement: "Logo placement",
  event_signage: "Event signage",
  vendor_table: "Vendor table or activation",
  social_media: "Social-media recognition",
  email_recognition: "Email recognition",
  player_gifts: "Player gifts or samples",
  naming_rights: "Naming or presenting rights",
  category_exclusivity: "Category exclusivity",
  product_distribution: "Product distribution",
  other: "Other requested benefit",
};

export const NONCASH_TREATMENTS = [
  "product_allocation",
  "cash_equivalent",
  "event_settlement_deduction",
  "other",
] as const;

export const NONCASH_TREATMENT_LABELS: Record<
  (typeof NONCASH_TREATMENTS)[number],
  string
> = {
  product_allocation: "Product allocation",
  cash_equivalent: "Cash equivalent",
  event_settlement_deduction: "Event-settlement deduction",
  other: "Other approved treatment",
};

export const SPONSORSHIP_ACKNOWLEDGMENTS = [
  {
    name: "notFinalized",
    label:
      "I have not promised, accepted or finalized this sponsorship on behalf of War Tournaments LLC or Racquet War.",
  },
  {
    name: "cannotBind",
    label:
      "I understand that I cannot bind War Tournaments LLC, Racquet War or an RW event to sponsor benefits, category exclusivity, pricing, deliverables or other commitments.",
  },
  {
    name: "writtenBenefits",
    label:
      "I understand that sponsor benefits, sponsorship value and any exclusivity require written approval from War Tournaments LLC.",
  },
  {
    name: "nationalRights",
    label:
      "I understand that national and corporate sponsorship rights remain with War Tournaments LLC.",
  },
  {
    name: "noMarks",
    label:
      "I understand that submitting this request does not authorize use of RW names, logos, trademarks or event rights.",
  },
  {
    name: "noDoubleCount",
    label:
      "Donated products, goods or services may not be counted both as sponsorship value and as a purchased event expense. I have not listed these donated items as a purchased event expense.",
  },
] as const;

export const DOUBLE_COUNT_RULE =
  "Donated products, goods or services may not be counted both as sponsorship value and as a purchased event expense.";

export function isEventStatus(value: string): value is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(value);
}

export function isSponsorshipStatus(value: string): value is SponsorshipStatus {
  return (SPONSORSHIP_STATUSES as readonly string[]).includes(value);
}

export function directorCanEditEvent(status: EventStatus) {
  return status === "draft" || status === "needs_information";
}

export function directorCanWithdrawEvent(status: EventStatus) {
  return (
    status === "submitted" ||
    status === "needs_information" ||
    status === "under_review" ||
    status === "approved_authorization_pending"
  );
}

export function directorCanEditSponsorship(status: SponsorshipStatus) {
  return status === "draft" || status === "needs_information";
}

export function directorCanWithdrawSponsorship(status: SponsorshipStatus) {
  return (
    status === "submitted" ||
    status === "needs_information" ||
    status === "under_review"
  );
}

export function isAdminOnlyEventStatus(value: string) {
  return (ADMIN_ONLY_EVENT_STATUSES as readonly string[]).includes(value);
}

export function isAdminOnlySponsorshipStatus(value: string) {
  return (ADMIN_ONLY_SPONSORSHIP_STATUSES as readonly string[]).includes(value);
}

export function createsEventAuthorization(status: EventStatus) {
  return status === "authorized";
}

export function newReference(prefix: string) {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `${prefix}-${suffix}`;
}
