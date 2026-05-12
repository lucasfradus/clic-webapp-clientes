import { create } from 'zustand';
import { getSedesAccesibles } from '../api/sedes';
import type { SedeAccesible } from '../types';

const STORAGE_KEY = 'clic.selectedSedeId';

function readStored(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function persist(id: number | null) {
  try {
    if (id === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    /* noop */
  }
}

interface SedeState {
  sedes: SedeAccesible[];
  selectedSedeId: number | null;
  loaded: boolean;
  bootstrap: () => Promise<void>;
  setSelectedSedeId: (id: number) => void;
  reset: () => void;
}

export const useSede = create<SedeState>((set, get) => ({
  sedes: [],
  selectedSedeId: null,
  loaded: false,

  bootstrap: async () => {
    const sedes = await getSedesAccesibles();
    const stored = readStored();
    const validStored = stored !== null && sedes.some((s) => s.id === stored);
    const fallback =
      sedes.find((s) => s.esHome)?.id ?? sedes[0]?.id ?? null;
    const selectedSedeId = validStored ? stored : fallback;
    if (selectedSedeId !== null) persist(selectedSedeId);
    set({ sedes, selectedSedeId, loaded: true });
  },

  setSelectedSedeId: (id) => {
    if (id === get().selectedSedeId) return;
    persist(id);
    set({ selectedSedeId: id });
  },

  reset: () => {
    persist(null);
    set({ sedes: [], selectedSedeId: null, loaded: false });
  },
}));

/** Devuelve la SedeAccesible seleccionada, o undefined si no hay. */
export function useSelectedSede(): SedeAccesible | undefined {
  return useSede((s) =>
    s.selectedSedeId === null
      ? undefined
      : s.sedes.find((x) => x.id === s.selectedSedeId)
  );
}
