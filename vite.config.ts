import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
   build: {
    target: ['es2018', 'chrome80', 'safari13'],
  },
})
