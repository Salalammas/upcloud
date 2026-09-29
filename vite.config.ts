import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three alone is ~600 KB minified; warn only on genuinely unexpected growth.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Without this, a group would also swallow its deps (e.g. postprocessing pulling in all of three).
          includeDependenciesRecursively: false,
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 50 },
            { name: 'vendor-postprocessing', test: /node_modules[\\/](postprocessing|@react-three[\\/]postprocessing)[\\/]/, priority: 40 },
            { name: 'vendor-r3f', test: /node_modules[\\/](@react-three|three-stdlib|zustand|its-fine|suspend-react|react-use-measure|@monogrid|troika-|camera-controls|maath|meshline|stats|detect-gpu|@use-gesture|hls\.js|tunnel-rat|three-mesh-bvh)/, priority: 30 },
            { name: 'vendor-three', test: /node_modules[\\/]three[\\/]/, priority: 20 },
            { name: 'vendor-motion', test: /node_modules[\\/](gsap|lenis)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
