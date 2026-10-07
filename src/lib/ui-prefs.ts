import { create } from "zustand";

interface UIPrefsState {
  liquidGlass: boolean;
  setLiquidGlass: (v: boolean) => void;
  toggleLiquidGlass: () => void;
}

const STORAGE_KEY = "promos-ui-prefs";

function loadPrefs(): { liquidGlass: boolean } {
  if (typeof window === "undefined") return { liquidGlass: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { liquidGlass: false };
    return JSON.parse(raw);
  } catch {
    return { liquidGlass: false };
  }
}

function savePrefs(prefs: { liquidGlass: boolean }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

const initial = loadPrefs();

export const useUIPrefs = create<UIPrefsState>((set, get) => ({
  liquidGlass: initial.liquidGlass,
  setLiquidGlass: (v) => {
    set({ liquidGlass: v });
    savePrefs({ liquidGlass: v });
  },
  toggleLiquidGlass: () => {
    const v = !get().liquidGlass;
    set({ liquidGlass: v });
    savePrefs({ liquidGlass: v });
  },
}));
