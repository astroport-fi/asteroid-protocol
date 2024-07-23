import 'dotenv/config'
import { z } from 'zod'

export const Config = z.object({
  DATABASE_URL: z.string(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_ENDPOINT: z.string(),
  S3_BUCKET: z.string(),
  PORT: z.string(),
  ASTEROID_API: z.string(),
  COSMOS_HUB_RPC: z.string(),
  COSMOS_HUB_REST: z.string(),
  GAS_PRICE: z.string(),
  MNEMONIC: z.string(),
  CHAIN_ID: z.string(),
  FEE_MULTIPLIER: z.string(),
})

export type Config = z.infer<typeof Config>

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Config {}
  }
}

export function loadConfig(): Config {
  const res = Config.safeParse(process.env)
  if (!res.success) {
    console.error(res.error.issues)
    throw new Error('Failed to load config from environment variables')
  }
  return res.data
}
