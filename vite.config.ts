import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  // recharts `react-is` (CommonJS) ga tayanadi; dev rejimida oldindan ESM'ga o'tkazilmasa "isFragment" xatosi chiqadi
  optimizeDeps: { include: ['react-is', 'recharts'] },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
