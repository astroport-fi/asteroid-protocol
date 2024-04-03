const {
  InscriptionOperations,
  SigningStargateClient,
} = require('@asteroid-protocol/sdk')
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing')
const { GasPrice } = require('@cosmjs/stargate')

const network = {
  chainId: 'gaialocal-1',
  rpc: 'http://localhost:16657',
  explorer: 'http://localhost:1316/cosmos/tx/v1beta1/txs/',
  api: 'http://localhost:8080/v1/graphql',
  gasPrice: '0.005uatom',
}

const mnemonic =
  'banner spread envelope side kite person disagree path silver will brother under couch edit food venture squirrel civil budget number acquire point work mass'

async function getSigner() {
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
