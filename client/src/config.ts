import { z } from 'zod'

export const CONFIG_NAME = 'asteroid.json'
export const CONFIG_PATH = `./${CONFIG_NAME}`

export const Networks: Record<string, Network> = {
  local: {
    chainId: 'gaialocal-1',
    rpc: 'http://localhost:16657',
    rest: 'http://localhost:1316',
    explorer: 'http://localhost:1316/cosmos/tx/v1beta1/txs/',
    api: 'http://localhost:8080/v1/graphql',
  },
  testnet: {
    chainId: 'theta-testnet-001',
    rpc: 'https://rpc.sentry-01.theta-testnet.polypore.xyz',
    rest: 'https://corsproxy.io/?https://rest.sentry-01.theta-testnet.polypore.xyz',
    explorer: 'https://www.mintscan.io/cosmoshub-testnet/tx/',
    api: 'https://testnet-api.asteroidprotocol.io/v1/graphql',
  },
  mainnet: {
    chainId: 'cosmoshub-4',
    rpc: 'https://rpc-nodes.asteroidprotocol.io',
    rest: 'https://nodes.asteroidprotocol.io',
    explorer: 'https://www.mintscan.io/cosmos/tx/',
    api: 'https://api.asteroidprotocol.io/v1/graphql',
  },
}

const DEFAULT_GAS_PRICE = '0.005uatom'
const DEFAULT_FEE_MULTIPLIER = 1.5

export const DEFAULT_CONFIG: Config = {
  gasPrice: DEFAULT_GAS_PRICE,
  feeMultiplier: DEFAULT_FEE_MULTIPLIER,
  networks: Networks,
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
  rest: z.string(),
  api: z.string(),
  explorer: z.string(),
})
export type Network = z.infer<typeof Network>

const Account = z.object({
  mnemonic: z.string(),
})
export type Account = z.infer<typeof Account>

export const Config = z.object({
  gasPrice: z.string().default(DEFAULT_GAS_PRICE),
  feeMultiplier: z.number().default(DEFAULT_FEE_MULTIPLIER),
  networks: z.record(z.string(), Network),
  accounts: z.record(z.string(), Account),
})

export type Config = z.infer<typeof Config>
