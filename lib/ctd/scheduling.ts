/**
 * Screening-call scheduling adapter.
 *
 * Today this only exposes Oakley's Microsoft Bookings page. Keep Graph
 * appointment sync behind this module so it can be added later without
 * changing candidate email or admin actions.
 */

export const SCREENING_BOOKING_ENV = "CTD_SCREENING_BOOKING_URL";

export type ScreeningSchedulerKind = "microsoft-bookings";

export type ScreeningBookingPage = {
  kind: ScreeningSchedulerKind;
  url: string;
};

function readBookingUrl() {
  return process.env[SCREENING_BOOKING_ENV]?.trim() || "";
}

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function getScreeningBookingPage(): ScreeningBookingPage | null {
  const raw = readBookingUrl();
  if (!raw || !isSafeHttpUrl(raw)) return null;

  return {
    kind: "microsoft-bookings",
    url: new URL(raw).toString(),
  };
}

export function getScreeningBookingUrl() {
  return getScreeningBookingPage()?.url ?? null;
}

export function isScreeningBookingConfigured() {
  return getScreeningBookingPage() !== null;
}

/**
 * Reserved for a later Microsoft Graph Bookings sync. This deployment does
 * not request new Graph permissions or pull appointments automatically.
 */
export async function syncBookedAppointments(): Promise<never> {
  throw new Error(
    "Microsoft Bookings synchronization is not enabled in this deployment.",
  );
}
