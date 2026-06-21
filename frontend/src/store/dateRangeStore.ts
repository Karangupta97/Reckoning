import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DateRangePeriod } from "@/lib/governance/date-range";

interface DateRangeState {
  period: DateRangePeriod;
  setPeriod: (period: DateRangePeriod) => void;
}

export const useDateRangeStore = create<DateRangeState>()(
  persist(
    (set) => ({
      period: "This Month",
      setPeriod: (period) => set({ period }),
    }),
    { name: "reckoning-date-range", version: 1 }
  )
);
