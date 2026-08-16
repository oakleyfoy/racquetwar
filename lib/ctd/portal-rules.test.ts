import { describe, expect, it } from "vitest";

import {
  assertEventReadyToSubmit,
  assertSponsorshipReady,
  computeTotalsFromInput,
  type EventProposalInput,
  type SponsorshipInput,
} from "./portal-db";
import {
  createsEventAuthorization,
  directorCanEditEvent,
  EVENT_ACKNOWLEDGMENTS,
  isAdminOnlyEventStatus,
  isAdminOnlySponsorshipStatus,
  SPONSORSHIP_ACKNOWLEDGMENTS,
} from "./portal-domain";

function eventInput(overrides: Partial<EventProposalInput> = {}): EventProposalInput {
  return {
    eventName: "Memphis Open",
    sport: "tennis",
    sportOther: "",
    address: "1 Court St",
    city: "Memphis",
    state: "TN",
    postalCode: "38103",
    country: "United States",
    facilityName: "City Courts",
    facilityContactName: "Pat",
    facilityContactEmail: "pat@example.com",
    facilityContactPhone: "9015550100",
    primaryStartDate: "2026-09-01",
    primaryEndDate: "2026-09-03",
    alternateStartDate: "",
    alternateEndDate: "",
    courtCount: "8",
    courtSetting: "outdoor",
    eventFormat: "Single elimination",
    divisions: "Open",
    estimatedPlayers: "20",
    recommendedEntryFee: "80.00",
    recommendedTeamFee: "",
    marketOpportunity: "Strong",
    localRelationships: "Clubs",
    competingEvents: "None",
    facilityTerms: "Quote 12",
    additionalNotes: "",
    overBudgetExplanation: "",
    acknowledgments: Object.fromEntries(
      EVENT_ACKNOWLEDGMENTS.map((item) => [item.name, true]),
    ),
    items: [
      {
        category: "facility_court",
        vendor: "City",
        description: "Courts",
        quantity: "1",
        unitCost: "400.00",
        costType: "fixed",
        quoteReference: "Q-1",
        explanation: "",
      },
    ],
    ...overrides,
  };
}

describe("event proposal rules", () => {
  it("requires acknowledgments and an over-budget explanation before submit", () => {
    const ready = eventInput();
    expect(() => assertEventReadyToSubmit(ready, computeTotalsFromInput(ready))).not.toThrow();

    const missingAck = eventInput({
      acknowledgments: Object.fromEntries(
        EVENT_ACKNOWLEDGMENTS.map((item) => [item.name, false]),
      ),
    });
    expect(() =>
      assertEventReadyToSubmit(missingAck, computeTotalsFromInput(missingAck)),
    ).toThrow(/acknowledgment/i);

    const over = eventInput({
      estimatedPlayers: "2",
      items: [
        {
          category: "facility_court",
          vendor: "City",
          description: "Courts",
          quantity: "1",
          unitCost: "400.00",
          costType: "fixed",
          quoteReference: "",
          explanation: "",
        },
      ],
      overBudgetExplanation: "",
    });
    expect(computeTotalsFromInput(over).overBaseline).toBe(true);
    expect(() => assertEventReadyToSubmit(over, computeTotalsFromInput(over))).toThrow(
      /\$65 per projected player/,
    );
  });

  it("only Authorized creates written event authorization", () => {
    expect(createsEventAuthorization("authorized")).toBe(true);
    expect(createsEventAuthorization("approved_authorization_pending")).toBe(false);
    expect(createsEventAuthorization("submitted")).toBe(false);
    expect(isAdminOnlyEventStatus("authorized")).toBe(true);
    expect(isAdminOnlyEventStatus("approved_authorization_pending")).toBe(true);
    expect(isAdminOnlyEventStatus("declined")).toBe(true);
    expect(isAdminOnlyEventStatus("cancelled")).toBe(true);
    expect(directorCanEditEvent("authorized")).toBe(false);
    expect(directorCanEditEvent("draft")).toBe(true);
  });
});

describe("sponsorship rules", () => {
  it("requires acknowledgments including the no-double-count rule", () => {
    const input: SponsorshipInput = {
      eventProposalId: "",
      sponsorName: "Local Club",
      sponsorContactName: "",
      sponsorEmail: "",
      sponsorPhone: "",
      sponsorWebsite: "",
      businessCategory: "",
      territory: "Memphis",
      stage: "lead_identified",
      startDate: "",
      endDate: "",
      cashAmount: "1000.00",
      includesNoncash: false,
      noncashDescription: "",
      noncashQuantity: "",
      requestedNoncashValue: "",
      valueExplanation: "",
      deliveryDate: "",
      additionalNotes: "",
      benefits: [],
      acknowledgments: Object.fromEntries(
        SPONSORSHIP_ACKNOWLEDGMENTS.map((item) => [item.name, true]),
      ),
    };
    expect(() => assertSponsorshipReady(input)).not.toThrow();
    expect(SPONSORSHIP_ACKNOWLEDGMENTS.some((item) => item.name === "noDoubleCount")).toBe(
      true,
    );
    expect(() =>
      assertSponsorshipReady({
        ...input,
        acknowledgments: { ...input.acknowledgments, noDoubleCount: false },
      }),
    ).toThrow(/acknowledgment/i);
    expect(isAdminOnlySponsorshipStatus("approved")).toBe(true);
    expect(isAdminOnlySponsorshipStatus("expired")).toBe(true);
  });
});
