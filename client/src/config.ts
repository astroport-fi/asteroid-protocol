import fs from 'fs/promises'
import { z } from 'zod'
import { fileExists } from './utils.js'

export const CONFIG_NAME = 'asteroid.json'

const DEFAULT_CONFIG: Config = {
  gasPrice: '0.005uatom',
  networks: {
    local: {
      chainId: 'gaialocal-1',
      rpc: 'http://localhost:16657',
      explorer: 'http://localhost:1316/cosmos/tx/v1beta1/txs/',
      api: 'http://localhost:8080/v1/graphql',
    },
    testnet: {
      chainId: 'theta-testnet-001',
      rpc: 'https://rpc.sentry-01.theta-testnet.polypore.xyz',
      explorer: 'https://www.mintscan.io/cosmoshub-testnet/tx/',
      api: 'https://api.asteroidprotocol.io/v1/graphql',
    },
    mainnet: {
      chainId: 'cosmoshub-4',
      rpc: 'https://rpc-nodes.asteroidprotocol.io',
      explorer: 'https://www.mintscan.io/cosmos/tx/',
      api: 'https://testnet-api.asteroidprotocol.io/v1/graphql',
    },
  },
  accounts: {
    test1: {
      mnemonic:
        'banner spread envelope side kite person disagree path silver will brother under couch edit food venture squirrel civil budget number acquire point work mass',
    },
  },
}

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
  const configPath = `./${CONFIG_NAME}`
  const exists = await fileExists(configPath)

  if (exists) {
    const configStr = await fs.readFile(configPath, 'utf8')
    try {
      return Config.parse(JSON.parse(configStr))
    } catch (err) {
      console.error('Config parsing error')
      throw err
    }
  }

  return Config.parse(DEFAULT_CONFIG)
}
