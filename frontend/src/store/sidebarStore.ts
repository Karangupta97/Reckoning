import { create } from "zustand";

interface SidebarState {
  /** Desktop expanded/collapsed */
  expanded: boolean;
  /** Mobile drawer open/closed */
  mobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  setExpanded: (v: boolean) => void;
  setMobileOpen: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  expanded: true,
  mobileOpen: false,
  toggle: () => set((s) => ({ expanded: !s.expanded })),
  toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
  setExpanded: (v) => set({ expanded: v }),
  setMobileOpen: (v) => set({ mobileOpen: v }),
}));
