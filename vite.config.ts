/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const brand = process.env.VITE_BRAND || 'clic';

const apiTargets: Record<string, string> = {
  clic: 'https://app.clicpilates.com',
  fit: 'https://app.clicpilates.com', // same backend — update if FIT gets its own domain
};

const previewHosts: Record<string, string[]> = {
  clic: ['.up.railway.app', 'clientes.clicpilates.com'],
  fit: ['.up.railway.app', 'clientes.clicfit.ar'],
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiTargets[brand] ?? apiTargets.clic,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    allowedHosts: previewHosts[brand] ?? previewHosts.clic,
  },
  test: {
    environment: 'node',
    // El formateo de fechas depende de la TZ: se fija la de los usuarios para
    // que los tests sean deterministicos corran donde corran.
    setupFiles: ['./src/test/setup-tz.ts'],
  },
});
