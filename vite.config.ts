import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    // Forçar modo produção
    'import.meta.env.VITE_ENVIRONMENT': '"production"',
    'import.meta.env.VITE_FORCE_REAL_SUPABASE': 'true',
  },
});