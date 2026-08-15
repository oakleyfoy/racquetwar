import { ADMIN_TIMEZONE } from "./workflow";

export function isValidIanaTimeZone(value: string) {
  if (!value.trim()) return false;

  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}

/** Interprets a wall-clock date and time in `timeZone` as a UTC Date. */
export function zonedDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("Enter a valid date and time.");
  }
  if (!isValidIanaTimeZone(timeZone)) {
    throw new Error("Enter a valid IANA timezone.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);

  let utc = desired;
  for (let index = 0; index < 4; index += 1) {
    const offset = getTimeZoneOffsetMs(new Date(utc), timeZone);
    utc = desired - offset;
  }

  return new Date(utc);
}

export function formatInstantInTimeZone(
  value: string | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", { timeZone, ...options }).format(date);
}

export function calendarDateInTimeZone(
  value: string | Date,
  timeZone: string,
) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function clockTimeInTimeZone(value: string | Date, timeZone: string) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.hour}:${parts.minute}`;
}

export type FollowUpUrgency = {
  overdue: boolean;
  dueToday: boolean;
  completed: boolean;
};

export function followUpUrgency(
  dueAt: string | Date | null | undefined,
  completedAt: string | Date | null | undefined,
  now: Date = new Date(),
  timeZone: string = ADMIN_TIMEZONE,
): FollowUpUrgency {
  if (completedAt) {
    return { overdue: false, dueToday: false, completed: true };
  }
  if (!dueAt) {
    return { overdue: false, dueToday: false, completed: false };
  }

  const due = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  if (Number.isNaN(due.getTime())) {
    return { overdue: false, dueToday: false, completed: false };
  }

  const dueToday =
    calendarDateInTimeZone(due, timeZone) ===
    calendarDateInTimeZone(now, timeZone);

  return {
    overdue: due.getTime() < now.getTime(),
    dueToday,
    completed: false,
  };
}

export function splitDateAndTimeForInput(
  iso: string | null | undefined,
  timeZone: string,
) {
  if (!iso) return { date: "", time: "" };
  return {
    date: calendarDateInTimeZone(iso, timeZone),
    time: clockTimeInTimeZone(iso, timeZone),
  };
}
