import { create } from "zustand";

interface UIState {
  mobileFilterOpen: boolean;
  darkMode: boolean;
  setMobileFilterOpen: (open: boolean) => void;
  toggleMobileFilter: () => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileFilterOpen: false,
  darkMode: true,
  setMobileFilterOpen: (open) => set({ mobileFilterOpen: open }),
  toggleMobileFilter: () =>
    set((state) => ({ mobileFilterOpen: !state.mobileFilterOpen })),
  toggleDarkMode: () =>
    set((state) => ({ darkMode: !state.darkMode })),
}));
