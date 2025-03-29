import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@ionic/core', '@stencil/core'],
    exclude: ['@ionic/core/loader']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});