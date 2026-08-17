import { computeTotalsFromInput, type EventProposalRecord, type SponsorshipInput } from "./portal-db";
import { EVENT_ACKNOWLEDGMENTS, SPONSORSHIP_ACKNOWLEDGMENTS } from "./portal-domain";

function emptyAcks(list: readonly { name: string }[]) {
  return Object.fromEntries(list.map((item) => [item.name, false]));
}

export function blankEventPreview(): EventProposalRecord {
  const input = {
    eventName: "",
    sport: "",
    sportOther: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    facilityName: "",
    facilityContactName: "",
    facilityContactEmail: "",
    facilityContactPhone: "",
    primaryStartDate: "",
    primaryEndDate: "",
    alternateStartDate: "",
    alternateEndDate: "",
    courtCount: "",
    courtSetting: "",
    eventFormat: "",
    divisions: "",
    estimatedPlayers: "",
    recommendedEntryFee: "",
    recommendedTeamFee: "",
    marketOpportunity: "",
    localRelationships: "",
    competingEvents: "",
    facilityTerms: "",
    additionalNotes: "",
    overBudgetExplanation: "",
    acknowledgments: emptyAcks(EVENT_ACKNOWLEDGMENTS),
    items: [],
  };

  return {
    ...input,
    id: "",
    directorId: "",
    currentStatus: "draft" as const,
    currentVersion: 1,
    submittedAt: null,
    updatedAt: "",
    totals: computeTotalsFromInput(input),
  };
}

export function blankSponsorshipPreview(): SponsorshipInput & { id: string } {
  return {
    id: "",
    eventProposalId: "",
    sponsorName: "",
    sponsorContactName: "",
    sponsorEmail: "",
    sponsorPhone: "",
    sponsorWebsite: "",
    businessCategory: "",
    territory: "",
    stage: "",
    startDate: "",
    endDate: "",
    cashAmount: "",
    includesNoncash: false,
    noncashDescription: "",
    noncashQuantity: "",
    requestedNoncashValue: "",
    valueExplanation: "",
    deliveryDate: "",
    additionalNotes: "",
    benefits: [],
    acknowledgments: emptyAcks(SPONSORSHIP_ACKNOWLEDGMENTS),
  };
}
