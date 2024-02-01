import fs from 'fs/promises'
import { z } from 'zod'

export const CONFIG_NAME = 'asteroid.json'

const Network = z.object({
  chainId: z.string(),
  rpc: z.string(),
  api: z.string(),
  explorer: z.string(),
})
export type Network = z.infer<typeof Network>

const Account = z.object({
  mnemonic: z.string(),
})
export type Account = z.infer<typeof Account>

const Config = z.object({
  gasPrice: z.string(),
  networks: z.record(z.string(), Network),
  accounts: z.record(z.string(), Account),
})

export type Config = z.infer<typeof Config>

export default async function loadConfig(): Promise<Config> {
  const configStr = await fs.readFile(`./${CONFIG_NAME}`, 'utf8')
  try {
    return Config.parse(JSON.parse(configStr))
  } catch (err) {
    console.error('Config parsing error')
    throw err
  }
}
