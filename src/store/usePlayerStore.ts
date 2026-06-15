import { create } from "zustand";

interface PlayerState {
  autoplay: boolean;
  theaterMode: boolean;
  toggleAutoplay: () => void;
  toggleTheaterMode: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  autoplay: true,
  theaterMode: false,
  toggleAutoplay: () => set((state) => ({ autoplay: !state.autoplay })),
  toggleTheaterMode: () =>
    set((state) => ({ theaterMode: !state.theaterMode })),
}));
