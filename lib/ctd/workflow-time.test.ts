import { describe, expect, it } from "vitest";

import { followUpUrgency, formatInstantInTimeZone, zonedDateTimeToUtc } from "./workflow-time";

describe("screening time conversion", () => {
  it("converts candidate-local time to UTC and back through America/Chicago", () => {
    const utc = zonedDateTimeToUtc("2026-08-15", "13:00", "America/Chicago");
    expect(utc.toISOString()).toBe("2026-08-15T18:00:00.000Z");

    const chicago = formatInstantInTimeZone(utc, "America/Chicago", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    expect(chicago).toContain("13:00");

    const newYork = zonedDateTimeToUtc("2026-08-15", "13:00", "America/New_York");
    expect(newYork.toISOString()).toBe("2026-08-15T17:00:00.000Z");
    expect(
      formatInstantInTimeZone(newYork, "America/Chicago", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }),
    ).toContain("12:00");
  });

  it("marks follow-ups overdue, due today, or completed", () => {
    const now = new Date("2026-08-15T18:00:00.000Z");

    expect(
      followUpUrgency("2026-08-15T17:00:00.000Z", null, now, "America/Chicago"),
    ).toEqual({ overdue: true, dueToday: true, completed: false });

    expect(
      followUpUrgency("2026-08-14T18:00:00.000Z", null, now, "America/Chicago"),
    ).toEqual({ overdue: true, dueToday: false, completed: false });

    expect(
      followUpUrgency(
        "2026-08-14T18:00:00.000Z",
        "2026-08-15T12:00:00.000Z",
        now,
        "America/Chicago",
      ),
    ).toEqual({ overdue: false, dueToday: false, completed: true });
  });
});
