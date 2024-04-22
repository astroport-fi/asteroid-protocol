import {
  AccountData,
  DirectSecp256k1HdWallet,
  OfflineSigner,
} from '@cosmjs/proto-signing'
import { GasPrice } from '@cosmjs/stargate'
import fs from 'fs/promises'
import { SigningStargateClient } from './client.js'
import { Config, DEFAULT_CONFIG, Network } from './config.js'
import { CONFIG_PATH } from './config.js'
import { AsteroidService } from './service/asteroid.js'
import { fileExists } from './utils/file.js'

export class Context {
  network: Network
  config: Config
  signer: OfflineSigner
  account: AccountData
  client: SigningStargateClient
  api: AsteroidService

  constructor(
    network: Network,
    config: Config,
    signer: OfflineSigner,
    account: AccountData,
    client: SigningStargateClient,
    api: AsteroidService,
  ) {
    this.network = network
    this.config = config
    this.signer = signer
    this.account = account
    this.client = client
    this.api = api
  }
}

export interface Options {
  network: string
  account?: string
  granter?: string
}

export default async function loadConfig(): Promise<Config> {
  const exists = await fileExists(CONFIG_PATH)

  if (exists) {
    const configStr = await fs.readFile(CONFIG_PATH, 'utf8')
    try {
      return Config.parse({ ...DEFAULT_CONFIG, ...JSON.parse(configStr) })
    } catch (err) {
      console.error('Config parsing error')
      throw err
    }
  }

  return Config.parse(DEFAULT_CONFIG)
}

export async function createContext(options: Options): Promise<Context> {
  // load config
  const config = await loadConfig()
  const network = config.networks[options.network]

  if (!options.account) {
    options.account = Object.keys(config.accounts)[0]
  }

  // load account
  const configAccount = config.accounts[options.account]
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
    configAccount.mnemonic,
  )
  const accounts = await wallet.getAccounts()
  const account = accounts[0]

  // connect client
  const client = await SigningStargateClient.connectWithSigner(
    network.rpc,
    wallet,
    {
      gasPrice: GasPrice.fromString(config.gasPrice),
      simulateEndpoint: network.rest,
    },
  )

  // api
  const api = new AsteroidService(network.api)

  // create context
  return new Context(network, config, wallet, account, client, api)
}
