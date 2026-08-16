import { describe, expect, it } from "vitest";

import {
  calculateEventBudget,
  calculateSponsorshipSplit,
  EXPENSE_BASELINE_CENTS_PER_PLAYER,
  formatCents,
  parseCents,
  RW_FEE_CENTS_PER_PLAYER,
} from "./portal-money";

describe("event budget calculations", () => {
  it("uses integer cents and a $35 RW fee per eligible player", () => {
    expect(RW_FEE_CENTS_PER_PLAYER).toBe(3500);
    const totals = calculateEventBudget(10, 10000, [
      { costType: "fixed", quantityHundredths: 100, unitCents: 20000 },
      { costType: "per_player", quantityHundredths: 100, unitCents: 500 },
    ]);

    expect(totals.estimatedPlayers).toBe(10);
    expect(totals.recommendedEntryFeeCents).toBe(10000);
    expect(totals.estimatedGrossCents).toBe(100000);
    expect(totals.rwFeeCents).toBe(35000);
    expect(totals.totalFixedCents).toBe(20000);
    expect(totals.totalPerPlayerCents).toBe(5000);
    expect(totals.totalExpensesCents).toBe(25000);
    expect(totals.expensePerPlayerCents).toBe(2500);
    expect(totals.remainingCents).toBe(40000);
    expect(totals.estimatedDirectorCompensationCents).toBe(40000);
    expect(totals.overBaseline).toBe(false);
  });

  it("warns when proposed expenses exceed $65 per projected player", () => {
    expect(EXPENSE_BASELINE_CENTS_PER_PLAYER).toBe(6500);
    const totals = calculateEventBudget(2, 15000, [
      { costType: "fixed", quantityHundredths: 100, unitCents: 20000 },
    ]);
    expect(totals.expensePerPlayerCents).toBe(10000);
    expect(totals.overBaseline).toBe(true);
  });

  it("parses money without floating-point storage", () => {
    expect(parseCents("12.34")).toBe(1234);
    expect(parseCents("$1,200.50")).toBe(120050);
    expect(formatCents(1234)).toBe("$12.34");
  });
});

describe("sponsorship 25/75 calculations", () => {
  it("splits cash 25/75 with remainder to the Director", () => {
    const split = calculateSponsorshipSplit(101, 0);
    expect(split.cashWarCents).toBe(25);
    expect(split.cashDirectorCents).toBe(76);
  });

  it("uses administrator-approved noncash value, not the Director request", () => {
    const requestedOnly = calculateSponsorshipSplit(10000, 0);
    expect(requestedOnly.approvedNoncashCents).toBe(0);
    expect(requestedOnly.noncashWarCents).toBe(0);

    const approved = calculateSponsorshipSplit(10000, 4000);
    expect(approved.approvedNoncashCents).toBe(4000);
    expect(approved.noncashWarCents).toBe(1000);
    expect(approved.noncashDirectorCents).toBe(3000);
  });
});
