import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const brand = process.env.VITE_BRAND || 'clic';

// La web nueva (repo `web-clicpilates-v2`) sirve este portal por rewrite bajo
// `clicpilates.com/mi-cuenta`, para que la sesión sea cookie de primera parte.
// Detrás de ese rewrite los assets tienen que pedirse a `/mi-cuenta/assets/...`,
// no a la raíz del dominio. El deploy de la web nueva buildea con
// VITE_BASE_PATH=/mi-cuenta/; el deploy actual, sin la variable, no cambia.
const base = process.env.VITE_BASE_PATH || '/';

const apiTargets: Record<string, string> = {
  clic: 'https://app.clicpilates.com',
  fit: 'https://app.clicpilates.com', // same backend — update if FIT gets its own domain
};

const previewHosts: Record<string, string[]> = {
  clic: ['.up.railway.app', 'clientes.clicpilates.com'],
  fit: ['.up.railway.app', 'clientes.clicfit.ar'],
};

export default defineConfig({
  base,
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
});
