/** Integer-cent money helpers. Never use floating-point for stored totals. */

export const RW_FEE_CENTS_PER_PLAYER = 3500;
export const EXPENSE_BASELINE_CENTS_PER_PLAYER = 6500;

export function parseCents(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }
  const raw = String(value ?? "").trim().replace(/[$,]/g, "");
  if (!raw) return 0;
  if (!/^-?\d+(\.\d{1,2})?$/.test(raw)) {
    throw new Error("Enter a valid dollar amount.");
  }
  const negative = raw.startsWith("-");
  const [whole, fraction = ""] = raw.replace("-", "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return negative ? -cents : cents;
}

export function parseQuantity(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100);
  }
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    throw new Error("Enter a valid quantity.");
  }
  const [whole, fraction = ""] = raw.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function formatCents(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${Math.floor(abs / 100).toLocaleString("en-US")}.${String(abs % 100).padStart(2, "0")}`;
}

export function lineTotalCents(
  quantityHundredths: number,
  unitCents: number,
  costType: "fixed" | "per_player",
  estimatedPlayers: number,
) {
  const base = Math.round((quantityHundredths * unitCents) / 100);
  if (costType === "per_player") {
    return base * Math.max(0, estimatedPlayers);
  }
  return base;
}

export function split2575(cents: number) {
  const war = Math.floor((cents * 25) / 100);
  return { warTournaments: war, director: cents - war };
}

export type EventBudgetTotals = {
  estimatedPlayers: number;
  recommendedEntryFeeCents: number;
  estimatedGrossCents: number;
  rwFeeCents: number;
  totalFixedCents: number;
  totalPerPlayerCents: number;
  totalExpensesCents: number;
  expensePerPlayerCents: number;
  remainingCents: number;
  estimatedDirectorCompensationCents: number;
  overBaseline: boolean;
};

export type BudgetLineInput = {
  costType: "fixed" | "per_player";
  quantityHundredths: number;
  unitCents: number;
};

export function calculateEventBudget(
  estimatedPlayers: number,
  recommendedEntryFeeCents: number,
  lines: BudgetLineInput[],
): EventBudgetTotals {
  const players = Math.max(0, Math.floor(estimatedPlayers));
  const estimatedGrossCents = players * recommendedEntryFeeCents;
  const rwFeeCents = players * RW_FEE_CENTS_PER_PLAYER;

  let totalFixedCents = 0;
  let totalPerPlayerCents = 0;
  for (const line of lines) {
    const total = lineTotalCents(
      line.quantityHundredths,
      line.unitCents,
      line.costType,
      players,
    );
    if (line.costType === "fixed") totalFixedCents += total;
    else totalPerPlayerCents += total;
  }

  const totalExpensesCents = totalFixedCents + totalPerPlayerCents;
  const expensePerPlayerCents =
    players > 0 ? Math.round(totalExpensesCents / players) : totalExpensesCents;
  const remainingCents = estimatedGrossCents - rwFeeCents - totalExpensesCents;

  return {
    estimatedPlayers: players,
    recommendedEntryFeeCents,
    estimatedGrossCents,
    rwFeeCents,
    totalFixedCents,
    totalPerPlayerCents,
    totalExpensesCents,
    expensePerPlayerCents,
    remainingCents,
    estimatedDirectorCompensationCents: remainingCents,
    overBaseline: expensePerPlayerCents > EXPENSE_BASELINE_CENTS_PER_PLAYER,
  };
}

export type SponsorshipSplit = {
  cashCents: number;
  cashWarCents: number;
  cashDirectorCents: number;
  approvedNoncashCents: number;
  noncashWarCents: number;
  noncashDirectorCents: number;
};

export function calculateSponsorshipSplit(
  cashCents: number,
  approvedNoncashCents: number,
): SponsorshipSplit {
  const cash = split2575(Math.max(0, cashCents));
  const noncash = split2575(Math.max(0, approvedNoncashCents));
  return {
    cashCents: Math.max(0, cashCents),
    cashWarCents: cash.warTournaments,
    cashDirectorCents: cash.director,
    approvedNoncashCents: Math.max(0, approvedNoncashCents),
    noncashWarCents: noncash.warTournaments,
    noncashDirectorCents: noncash.director,
  };
}
