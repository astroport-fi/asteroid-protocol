/// <reference types="@remix-run/cloudflare" />
/// <reference types="vite/client" />
import '@cloudflare/workers-types'

declare module '@remix-run/cloudflare' {
  interface AppLoadContext {
    env: {
      ENVIRONMENT: string
      MAX_FILE_SIZE: string
      ASTEROID_API: string
      ASTEROID_API_WSS: string
      TX_EXPLORER: string
      RPC: string
      REST: string
      CHAIN_ID: string
      CHAIN_NAME: string
      GAS_PRICE: string
      USE_IBC: string
    }
  }
}
