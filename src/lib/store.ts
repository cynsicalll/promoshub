import { create } from "zustand";

export type ViewKey =
  | "dashboard"
  | "promos"
  | "promo-detail"
  | "money"
  | "monthly"
  | "sounds"
  | "customers"
  | "stats"
  | "channel"
  | "settings";

interface AppState {
  view: ViewKey;
  selectedPromoId: string | null;
  // promo list filters
  promoFilter: string;
  moneyFilter: string;
  periodFilter: string;
  searchQuery: string;
  setView: (v: ViewKey) => void;
  openPromo: (id: string) => void;
  setPromoFilter: (f: string) => void;
  setMoneyFilter: (f: string) => void;
  setPeriodFilter: (f: string) => void;
  setSearchQuery: (q: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  selectedPromoId: null,
  promoFilter: "alle",
  moneyFilter: "alle",
  periodFilter: "alle",
  searchQuery: "",
  setView: (v) => set({ view: v, selectedPromoId: v === "promo-detail" ? undefined : null }),
  openPromo: (id) => set({ view: "promo-detail", selectedPromoId: id }),
  setPromoFilter: (f) => set({ promoFilter: f }),
  setMoneyFilter: (f) => set({ moneyFilter: f }),
  setPeriodFilter: (f) => set({ periodFilter: f }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
