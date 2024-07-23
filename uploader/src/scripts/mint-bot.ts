import {
  InscriptionOperations,
  NFTMetadata,
  SigningStargateClient,
  broadcastTx,
} from '@asteroid-protocol/sdk'
import { getExecSendGrantMsg } from '@asteroid-protocol/sdk/msg'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { GasPrice } from '@cosmjs/stargate'
import { AsteroidClient } from '../asteroid-client.js'
import { loadConfig } from '../config.js'

interface InscriptionMetadata extends NFTMetadata {
  filename: string
}

async function main() {
  const config = loadConfig()

  // api
  const api = new AsteroidClient(config.ASTEROID_API)

  // load account
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(config.MNEMONIC)
  const accounts = await wallet.getAccounts()
  const account = accounts[0]

  // connect client
  const client = await SigningStargateClient.connectWithSigner(
    config.COSMOS_HUB_RPC,
    wallet,
    {
      gasPrice: GasPrice.fromString(config.GAS_PRICE),
      simulateEndpoint: config.COSMOS_HUB_REST,
    },
  )

  // get reservation
  const reservations = await api.getLaunchpadMintReservations()
  const reservation = reservations[0]

  console.log(JSON.stringify(reservation, null, 4))

  // download inscription content and metadata
  const metadataUrl = `https://${config.S3_BUCKET}.${config.S3_ENDPOINT}/${reservation.launchpad.transaction.hash}/${reservation.token_id}_metadata.json`
  const metadata = (await fetch(metadataUrl).then((res) =>
    res.json(),
  )) as InscriptionMetadata

  const inscriptionUrl = `https://${config.S3_BUCKET}.${config.S3_ENDPOINT}/${reservation.launchpad.transaction.hash}/${metadata.filename}`
  const inscriptionBuffer = await fetch(inscriptionUrl).then((res) =>
    res.arrayBuffer(),
  )

  // create inscription operations
  const operations = new InscriptionOperations(
    config.CHAIN_ID,
    reservation.address,
  )
  const txData = operations.inscribeCollectionInscription(
    reservation.launchpad.collection.transaction.hash,
    new Uint8Array(inscriptionBuffer),
    metadata,
  )
  // wrap to exec send grant
  const msgs = txData.messages.map((msg) =>
    getExecSendGrantMsg(account.address, msg.value),
  )
  txData.messages = msgs

  // sign and broadcast
  const explorer = 'http://localhost:1316/cosmos/tx/v1beta1/txs/'
  const res = await broadcastTx(
    client,
    account.address,
    txData,
    parseFloat(config.FEE_MULTIPLIER),
  )
  console.log(`${explorer}${res.transactionHash}`)
}

main()
