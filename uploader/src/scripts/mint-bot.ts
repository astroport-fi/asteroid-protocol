import {
  InscriptionOperations,
  NFTMetadata,
  SigningStargateClient,
  broadcastTx,
} from '@asteroid-protocol/sdk'
import { getExecSendGrantMsg } from '@asteroid-protocol/sdk/msg'
import { Coin, DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { GasPrice } from '@cosmjs/stargate'
import { SendAuthorization } from 'cosmjs-types/cosmos/bank/v1beta1/authz.js'
import { AsteroidClient } from '../asteroid-client.js'
import { loadConfig } from '../config.js'
import { estimate } from '../cosmos-client.js'

async function main() {
  const config = loadConfig()
  const gasMultiplier = parseFloat(config.GAS_MULTIPLIER)
  const feeMultiplier = 1

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
  const launchpadTx = reservation.launchpad.transaction
  const { collection } = reservation.launchpad

  // download inscription content and metadata
  const metadataUrl = `https://${config.S3_BUCKET}.${config.S3_ENDPOINT}/${launchpadTx.hash}/${reservation.token_id}_metadata.json`
  const metadata = (await fetch(metadataUrl).then((res) =>
    res.json(),
  )) as NFTMetadata
  metadata.token_id = reservation.token_id

  const inscriptionUrl = `https://${config.S3_BUCKET}.${config.S3_ENDPOINT}/${launchpadTx.hash}/${metadata.filename}`
  const inscriptionBuffer = await fetch(inscriptionUrl).then((res) =>
    res.arrayBuffer(),
  )

  // check there is enough allowed funds to pay for the inscription and fee

  // create inscription operations
  const operations = new InscriptionOperations(
    config.CHAIN_ID,
    reservation.address,
  )
  const txData = operations.inscribeCollectionInscription(
    collection.transaction.hash,
    new Uint8Array(inscriptionBuffer),
    metadata,
  )
  // wrap to exec send grant
  const msgs = txData.messages.map((msg) =>
    getExecSendGrantMsg(account.address, msg.value),
  )

  if (reservation.stage.price) {
    msgs.push(
      getExecSendGrantMsg(account.address, {
        fromAddress: reservation.address,
        toAddress: collection.creator,
        amount: [{ amount: `${reservation.stage.price}`, denom: 'uatom' }],
      }),
    )
  }

  txData.messages = msgs

  // estimate transactions fee
  console.log('!!feeEstimation1')
  const feeEstimation1 = await estimate(
    client,
    account.address,
    txData,
    gasMultiplier,
    feeMultiplier,
  )

  txData.messages = msgs.concat([
    getExecSendGrantMsg(account.address, {
      fromAddress: reservation.address,
      toAddress: account.address,
      amount: feeEstimation1.amount as Coin[],
    }),
  ])

  console.log('!!feeEstimation2')
  const feeEstimation2 = await estimate(
    client,
    account.address,
    txData,
    gasMultiplier,
    feeMultiplier,
  )

  txData.messages = msgs.concat([
    getExecSendGrantMsg(account.address, {
      fromAddress: reservation.address,
      toAddress: account.address,
      amount: feeEstimation2.amount as Coin[],
    }),
  ])

  // check grant
  const grants = await client
    .forceGetQueryClient()
    .authz.grants(
      reservation.address,
      account.address,
      '/cosmos.bank.v1beta1.MsgSend',
    )
  const authorizationProto = grants.grants?.[0]?.authorization
  if (!authorizationProto) {
    // @todo
    throw new Error('no authorization')
  }
  const sendAuthorization = SendAuthorization.decode(authorizationProto.value)
  const authorizedCoin = sendAuthorization.spendLimit.find(
    (coin) => coin.denom === 'uatom',
  )
  if (!authorizedCoin) {
    // @todo
    throw new Error('insufficient authorization amount')
  }
  const authorizedAmount = parseInt(authorizedCoin.amount, 10)
  const requiredAmount =
    parseInt(feeEstimation2.amount[0].amount, 10) +
    (reservation.stage.price ?? 0) +
    1

  console.log(authorizedAmount, requiredAmount)
  if (requiredAmount > authorizedAmount) {
    // @todo
    throw new Error('insufficient authorization amount')
  }

  // sign and broadcast
  const explorer = 'http://localhost:1316/cosmos/tx/v1beta1/txs/'
  const res = await broadcastTx(client, account.address, txData, gasMultiplier)
  console.log(`${explorer}${res.transactionHash}`)
}

main()
