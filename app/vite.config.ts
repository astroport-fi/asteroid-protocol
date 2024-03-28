import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from '@remix-run/dev'
import { defineConfig } from 'vite'
import envOnly from 'vite-env-only'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    ViteImageOptimizer(),
    envOnly(),
    remixCloudflareDevProxy(),
    remix(),
    tsconfigPaths(),
    nodePolyfills({
      include: ['buffer', 'stream', 'crypto'],
      globals: {
        Buffer: true,
      },
      protocolImports: true,
    }),
  ],
})
