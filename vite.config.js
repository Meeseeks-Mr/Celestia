import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` produces relative asset URLs so the build works under any GitHub Pages
// path (e.g. https://USER.github.io/REPO/). For a custom domain you can set base: '/'.
export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
})
