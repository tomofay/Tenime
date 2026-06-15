import { create } from "zustand";

interface UIState {
  mobileFilterOpen: boolean;
  setMobileFilterOpen: (open: boolean) => void;
  toggleMobileFilter: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileFilterOpen: false,
  setMobileFilterOpen: (open) => set({ mobileFilterOpen: open }),
  toggleMobileFilter: () =>
    set((state) => ({ mobileFilterOpen: !state.mobileFilterOpen })),
}));
