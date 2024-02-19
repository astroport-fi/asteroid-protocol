import {
  unstable_cloudflarePreset as cloudflare,
  unstable_vitePlugin as remix,
} from '@remix-run/dev'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    remix({
      presets: [cloudflare()],
    }),
    tsconfigPaths(),
    nodePolyfills({
      include: ['buffer'],
      globals: {
        Buffer: true,
      },
    }),
  ],
  ssr: {
    resolve: {
      externalConditions: ['workerd', 'worker'],
    },
  },
})
