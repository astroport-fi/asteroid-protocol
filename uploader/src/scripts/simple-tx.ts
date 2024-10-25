import {
  InscriptionOperations,
  SigningStargateClient,
} from '@asteroid-protocol/sdk'
import { AccountData, DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { GasPrice } from '@cosmjs/stargate'

const network = {
  gasPrice: '0.005uatom',
  chainId: 'theta-testnet-001',
  // rpc: 'https://rpc.sentry-01.theta-testnet.polypore.xyz',
  rpc: 'https://rpc-t.cosmos.nodestake.org',
  explorer: 'https://www.mintscan.io/cosmos-testnet/tx/',
  api: 'https://testnet-new-api.asteroidprotocol.io/v1/graphql',
}

const mnemonic =
  'banner spread envelope side kite person disagree path silver will brother under couch edit food venture squirrel civil budget number acquire point work mass'

async function getSigner(): Promise<[DirectSecp256k1HdWallet, AccountData]> {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic)
  const accounts = await wallet.getAccounts()
  return [wallet, accounts[0]]
}

async function main() {
  // get signer
  const [signer, account] = await getSigner()

  // create a inscription transaction
  const operations = new InscriptionOperations(network.chainId, account.address)

  const data = new TextEncoder().encode('SOME DATA')
  const txData = operations.inscribe(data, {
    mime: 'text/plain',
    name: 'some text',
    description: 'some text description',
  })

  // connect client
  const client = await SigningStargateClient.connectWithSigner(
    network.rpc,
    signer,
    { gasPrice: GasPrice.fromString(network.gasPrice) },
  )

  // broadcast tx
  const res = await client.signAndBroadcast(
    account.address,
    txData.messages,
    'auto',
    txData.memo,
    undefined,
    txData.nonCriticalExtensionOptions,
  )

  console.log(`${network.explorer}${res.transactionHash}`)
}

main()
