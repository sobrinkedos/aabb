import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    // Permitir que as variáveis do .env sejam usadas
    'import.meta.env.VITE_FORCE_REAL_SUPABASE': 'true',
  },
});