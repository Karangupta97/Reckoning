/**
 * Shared date-range filtering for all admin dashboards.
 */

export type DateRangePeriod =
  | "Today"
  | "This Week"
  | "This Month"
  | "This Quarter"
  | "This Year";

export const DATE_RANGE_OPTIONS: DateRangePeriod[] = [
  "Today",
  "This Week",
  "This Month",
  "This Quarter",
  "This Year",
];

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/** Parse ISO or human-readable record dates used across stores. */
export function parseRecordDate(value: string | undefined): Date | null {
  if (!value) return null;

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const long = value.match(
    /(\d{1,2})\s+([A-Za-z]{3}),?\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i
  );
  if (long) {
    const day = Number(long[1]);
    const month = MONTHS[long[2].toLowerCase()];
    const year = Number(long[3]);
    if (month === undefined) return null;
    let hours = long[4] ? Number(long[4]) : 12;
    const minutes = long[5] ? Number(long[5]) : 0;
    const meridiem = long[6]?.toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return new Date(year, month, day, hours, minutes);
  }

  const short = value.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (short) {
    const month = MONTHS[short[2].toLowerCase()];
    if (month === undefined) return null;
    return new Date(Number(short[3]), month, Number(short[1]));
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function getDateRangeBounds(
  period: DateRangePeriod,
  reference: Date = new Date()
): { start: Date; end: Date } {
  const end = endOfDay(reference);

  switch (period) {
    case "Today":
      return { start: startOfDay(reference), end };
    case "This Week": {
      const start = startOfDay(new Date(reference));
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
      return { start, end };
    }
    case "This Month":
      return {
        start: new Date(reference.getFullYear(), reference.getMonth(), 1),
        end,
      };
    case "This Quarter": {
      const quarter = Math.floor(reference.getMonth() / 3);
      return {
        start: new Date(reference.getFullYear(), quarter * 3, 1),
        end,
      };
    }
    case "This Year":
      return {
        start: new Date(reference.getFullYear(), 0, 1),
        end,
      };
    default:
      return { start: new Date(0), end };
  }
}

export function isDateInRange(
  date: Date | null,
  period: DateRangePeriod,
  reference: Date = new Date()
): boolean {
  if (!date) return false;
  const { start, end } = getDateRangeBounds(period, reference);
  return date >= start && date <= end;
}

export function recordInDateRange(
  primaryDate: string | undefined,
  fallbackDate: string | undefined,
  period: DateRangePeriod
): boolean {
  const date =
    parseRecordDate(primaryDate) ??
    parseRecordDate(fallbackDate);
  return isDateInRange(date, period);
}

export function filterByDateRange<T>(
  items: T[],
  period: DateRangePeriod,
  getPrimaryDate: (item: T) => string | undefined,
  getFallbackDate?: (item: T) => string | undefined
): T[] {
  return items.filter((item) =>
    recordInDateRange(
      getPrimaryDate(item),
      getFallbackDate?.(item),
      period
    )
  );
}
