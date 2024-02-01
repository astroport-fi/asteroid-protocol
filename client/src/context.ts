import {
  AccountData,
  DirectSecp256k1HdWallet,
  OfflineSigner,
} from '@cosmjs/proto-signing'
import { GasPrice } from '@cosmjs/stargate'
import { SigningStargateClient } from './client.js'
import type { Config, Network } from './config.js'
import loadConfig from './config.js'
import AsteroidService from './service/asteroid.js'

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
    { gasPrice: GasPrice.fromString(config.gasPrice) },
  )

  // api
  const api = new AsteroidService(network.api)

  // create context
  return new Context(network, config, wallet, account, client, api)
}
