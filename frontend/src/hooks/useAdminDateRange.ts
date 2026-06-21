"use client";

import { DATE_RANGE_OPTIONS, type DateRangePeriod } from "@/lib/governance/date-range";
import { useDateRangeStore } from "@/store/dateRangeStore";

export { DATE_RANGE_OPTIONS, type DateRangePeriod };

export function useAdminDateRange() {
  const period = useDateRangeStore((s) => s.period);
  const setPeriod = useDateRangeStore((s) => s.setPeriod);
  return { period, setPeriod, options: DATE_RANGE_OPTIONS };
}
