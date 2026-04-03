import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
          if (id.includes('src/pages/Dashboard')) {
            return 'dashboard';
          }
          if (id.includes('src/components/POS')) {
            return 'pos';
          }
          if (id.includes('src/pages/Home')) {
            return 'home';
          }
          if (id.includes('src/pages/Login') || id.includes('src/pages/CustomerAuth')) {
            return 'auth';
          }
        }
      }
    },
    chunkSizeWarningLimit: 700,
  }
});
