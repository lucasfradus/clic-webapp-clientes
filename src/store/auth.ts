import { create } from 'zustand';
import * as authApi from '../api/auth';
import * as perfilApi from '../api/perfil';
import { setToken, clearToken, getToken } from '../api/client';
import { useSede } from './sede';
import type { AuthUser, Perfil } from '../types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  perfil: Perfil | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchPerfil: () => Promise<Perfil>;
  bootstrap: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: getToken(),
  user: null,
  perfil: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await authApi.login(email, password);
      setToken(res.token);
      set({ token: res.token, user: res.user });
      await get().fetchPerfil();
      // Sedes solo si hay suscripcion activa (404 si no). Best-effort.
      await useSede.getState().bootstrap().catch(() => {});
    } catch (err) {
      // Si fetchPerfil falla, limpiar estado para no quedar en "Cargando…"
      clearToken();
      set({ token: null, user: null, perfil: null });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    clearToken();
    useSede.getState().reset();
    set({ token: null, user: null, perfil: null });
  },

  fetchPerfil: async () => {
    const perfil = await perfilApi.getPerfil();
    set({ perfil });
    return perfil;
  },

  bootstrap: async () => {
    if (!get().token) return;
    try {
      await get().fetchPerfil();
      await useSede.getState().bootstrap().catch(() => {});
    } catch {
      // Si falla (401, 500, etc.) limpiar estado para no quedar en "Cargando…"
      get().logout();
    }
  },
}));
