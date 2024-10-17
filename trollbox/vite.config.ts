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
  server: {
    port: 5174,
  },
  plugins: [
    ViteImageOptimizer(),
    envOnly(),
    remixCloudflareDevProxy(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
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
