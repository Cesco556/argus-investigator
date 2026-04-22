"use client";

import { create } from "zustand";

export interface PlayheadDomain {
  min: number;
  max: number;
}

interface PlayheadState {
  current: number | null;
  domain: PlayheadDomain | null;
  setCurrent: (t: number | null) => void;
  setDomain: (d: PlayheadDomain | null) => void;
}

export const usePlayheadStore = create<PlayheadState>((set) => ({
  current: null,
  domain: null,
  setCurrent: (t) => set({ current: t }),
  setDomain: (d) => set({ domain: d }),
}));
