import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// In development, every /api request is sent to the Node.js backend (no CORS problems).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
