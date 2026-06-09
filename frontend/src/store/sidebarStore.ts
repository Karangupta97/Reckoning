import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarState {
  /** Desktop expanded/collapsed */
  expanded: boolean;
  /** Mobile drawer open/closed — never persisted */
  mobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  setExpanded: (v: boolean) => void;
  setMobileOpen: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      expanded: true,
      mobileOpen: false,
      toggle: () => set((s) => ({ expanded: !s.expanded })),
      toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
      setExpanded: (v) => set({ expanded: v }),
      setMobileOpen: (v) => set({ mobileOpen: v }),
    }),
    {
      name: "reckoning-sidebar",
      storage: createJSONStorage(() => localStorage),
      // Only persist the expanded state — mobileOpen should always start closed
      partialize: (state) => ({ expanded: state.expanded }),
    }
  )
);
