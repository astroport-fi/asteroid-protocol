import {
  InscriptionOperations,
  NFTMetadata,
  SigningStargateClient,
  TxData,
  broadcastTx,
} from '@asteroid-protocol/sdk'
import { getExecSendGrantMsg } from '@asteroid-protocol/sdk/msg'
import { Coin, DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { GasPrice, StdFee } from '@cosmjs/stargate'
import { SendAuthorization } from 'cosmjs-types/cosmos/bank/v1beta1/authz.js'
import sharp from 'sharp'
import { AsteroidClient, LaunchpadMintReservation } from '../asteroid-client.js'
import { Config, loadConfig } from '../config.js'
import { estimate } from '../cosmos-client.js'
import { connect } from '../db.js'

interface PfpMetadata {
  pfp: string
  name: string
  coords: {
    x: number
    y: number
    width: number
    height: number
  }
  token_id: number
}

async function pfpStickerMiddleware(
  reservation: LaunchpadMintReservation,
  nftMetadata: Required<NFTMetadata>,
  inscriptionBuffer: ArrayBuffer,
) {
  console.log('PFPMiddleware', JSON.stringify(reservation.metadata, null, 2))

  const reservationMetadata = reservation.metadata as PfpMetadata

  // update nft metadata
  nftMetadata.name = `${reservation.launchpad.collection.name} #${reservation.reservation_id}`
  nftMetadata.description = `Signed by ${reservationMetadata.name}`
  nftMetadata.token_id = reservation.reservation_id
  nftMetadata.mime = 'image/png'

  // create inscription image
  const imageData = await fetch(reservationMetadata.pfp).then((res) =>
    res.arrayBuffer(),
  )
  const image = sharp(imageData)
  const imageMetadata = await image.metadata()
  const imageWidth = imageMetadata.width as number
  const imageHeight = imageMetadata.height as number

  const relativeCoords = reservationMetadata.coords

  const resizedOverlayWidth = Math.floor(relativeCoords.width * imageWidth)
  const x = Math.floor(relativeCoords.x * imageWidth)
  const y = Math.floor(relativeCoords.y * imageHeight)

  const resizedOverlay = await sharp(inscriptionBuffer)
    .resize(resizedOverlayWidth)
    .toBuffer()
  const composedImage = await image
    .composite([
      {
        input: resizedOverlay,
        left: x,
        top: y,
      },
    ])
    .png({ quality: 100 })
    .toBuffer()

  return {
    nftMetadata,
    image: composedImage,
  }
}

async function buildInscription(
  config: Config,
  collectionHash: string,
  folder: string,
  tokenId: number,
  reservation: LaunchpadMintReservation,
): Promise<{ txData: TxData; price: number | undefined }> {
  const metadataUrl = `https://${config.S3_BUCKET}.${config.S3_ENDPOINT}/${folder}/${tokenId}_metadata.json`
  let metadata = (await fetch(metadataUrl).then((res) =>
    res.json(),
  )) as Required<NFTMetadata>
  metadata.token_id = tokenId

  const inscriptionUrl = `https://${config.S3_BUCKET}.${config.S3_ENDPOINT}/${folder}/${encodeURIComponent(metadata.filename)}`
  let inscriptionBuffer = await fetch(inscriptionUrl).then((res) =>
    res.arrayBuffer(),
  )

  if (
    reservation.metadata &&
    typeof reservation.metadata === 'object' &&
    'pfp' in reservation.metadata
  ) {
    const pfpRes = await pfpStickerMiddleware(
      reservation,
      metadata,
      inscriptionBuffer,
    )
    metadata = pfpRes.nftMetadata
    inscriptionBuffer = pfpRes.image
  }

  // create inscription operations
  const operations = new InscriptionOperations(
    config.CHAIN_ID,
    reservation.address,
  )
  return {
    txData: operations.inscribeCollectionInscription(
      collectionHash,
      new Uint8Array(inscriptionBuffer),
      metadata,
    ),
    price: metadata.price,
  }
}

async function calculateFee(
  client: SigningStargateClient,
  address: string,
  reservationAddress: string,
  txData: TxData,
  gasMultiplier: number,
  feeMultiplier: number = 1,
) {
  const preFeeEstimation = await estimate(
    client,
    address,
    txData,
    gasMultiplier,
    feeMultiplier,
  )

  const msgs = txData.messages

  txData.messages = msgs.concat([
    getExecSendGrantMsg(address, {
      fromAddress: reservationAddress,
      toAddress: address,
      amount: preFeeEstimation.amount as Coin[],
    }),
  ])

  const feeEstimation = await estimate(
    client,
    address,
    txData,
    gasMultiplier,
    feeMultiplier,
  )

  txData.messages = msgs.concat([
    getExecSendGrantMsg(address, {
      fromAddress: reservationAddress,
      toAddress: address,
      amount: feeEstimation.amount as Coin[],
    }),
  ])

  return feeEstimation
}

async function checkGrant(
  client: SigningStargateClient,
  address: string,
  reservationAddress: string,
  feeEstimation: StdFee,
  price: number | undefined,
) {
  const grants = await client
    .forceGetQueryClient()
    .authz.grants(reservationAddress, address, '/cosmos.bank.v1beta1.MsgSend')
  const authorizationProto = grants.grants?.[0]?.authorization
  if (!authorizationProto) {
    throw new Error('no authorization')
  }
  const sendAuthorization = SendAuthorization.decode(authorizationProto.value)
  const authorizedCoin = sendAuthorization.spendLimit.find(
    (coin) => coin.denom === 'uatom',
  )
  if (!authorizedCoin) {
    throw new Error('insufficient authorization amount')
  }
  const authorizedAmount = parseInt(authorizedCoin.amount, 10)
  const requiredAmount =
    parseInt(feeEstimation.amount[0].amount, 10) + (price ?? 0) + 1

  if (requiredAmount > authorizedAmount) {
    throw new Error('insufficient authorization amount')
  }
}

async function processMintReservation(
  config: Config,
  api: AsteroidClient,
  client: SigningStargateClient,
  address: string,
  reservation: LaunchpadMintReservation,
  launchpadFolder: string,
  gasMultiplier: number,
) {
  const { launchpad } = reservation
  const { collection } = launchpad

  let tokenId: number | null = null
  if (reservation.is_random) {
    // random token_id
    // 1. random number between 1 and launchpad.max_supply
    // 2. check if token_id is already minted
    // 3. if not, mint token_id, otherwise repeat step 1
    let tokenId = Math.floor(Math.random() * launchpad.max_supply) + 1
    let minted = await api.checkIfMinted(collection.id, tokenId)
    console.log(`Checking if token_id ${tokenId} is already minted...`)
    while (minted) {
      tokenId = Math.floor(Math.random() * launchpad.max_supply) + 1
      minted = await api.checkIfMinted(collection.id, tokenId)
    }
  } else if (reservation.token_id) {
    tokenId = reservation.token_id
  }

  if (!tokenId) {
    throw new Error('Unable to determine token_id')
  }

  // download inscription content and metadata
  const { txData, price: inscriptionPrice } = await buildInscription(
    config,
    collection.transaction.hash,
    launchpadFolder,
    tokenId,
    reservation,
  )

  // wrap to exec send grant
  const msgs = txData.messages.map((msg) =>
    getExecSendGrantMsg(address, msg.value),
  )

  // add launchpad inscription or stage payment
  const price = inscriptionPrice ?? reservation.stage.price
  if (price) {
    msgs.push(
      getExecSendGrantMsg(address, {
        fromAddress: reservation.address,
        toAddress: collection.creator,
        amount: [{ amount: `${price}`, denom: 'uatom' }],
      }),
    )
  }

  txData.messages = msgs

  // estimate transactions fee
  const feeEstimation = await calculateFee(
    client,
    address,
    reservation.address,
    txData,
    gasMultiplier,
  )

  // check grant
  await checkGrant(client, address, reservation.address, feeEstimation, price)

  // sign and broadcast
  const res = await broadcastTx(client, address, txData, gasMultiplier)
  if (res.code) {
    throw new Error(`Transaction failed with code: ${res.code}`)
  }
  console.log(
    `Reservation successfully processed, transaction hash: ${res.transactionHash}`,
  )
}

async function main() {
  const config = loadConfig()
  const gasMultiplier = parseFloat(config.GAS_MULTIPLIER)

  // api
  const api = new AsteroidClient(config.ASTEROID_API)

  // db
  const db = connect(config.DATABASE_URL)

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

  // periodically check for new reservations, use setTimeout
  async function loop() {
    console.log('Fetching unprocessed reservations...')

    // get unprocessed reservations
    const reservations = await api.getLaunchpadMintReservations()

    console.log(
      `Starting to process ${reservations.length} unprocessed reservations`,
    )

    const now = new Date()

    for (const reservation of reservations) {
      const { launchpad } = reservation

      try {
        if (!launchpad.reveal_immediately) {
          if (launchpad.reveal_date) {
            const revealDate = new Date(launchpad.reveal_date)
            if (now < revealDate) {
              console.log(
                `Reservation not ready for processing, launchpad_hash: ${launchpad.transaction.hash}, reservation_id: ${reservation.reservation_id}, reveal_date: ${revealDate}`,
              )
              continue
            }
          } else {
            if (
              launchpad.max_supply &&
              launchpad.minted_supply != launchpad.max_supply
            ) {
              console.log(
                `Reservation not ready for processing, launchpad_hash: ${launchpad.transaction.hash}, reservation_id: ${reservation.reservation_id}, max_supply: ${launchpad.max_supply}, minted_supply: ${launchpad.minted_supply}`,
              )
              continue
            }
          }
        }

        const row = await db('launchpad')
          .select('folder')
          .where({
            hash: launchpad.transaction.hash,
          })
          .first()

        if (!row) {
          console.error(
            `Unable to find launchpad folder, launchpad_hash: ${launchpad.transaction.hash}`,
          )
          continue
        }

        await processMintReservation(
          config,
          api,
          client,
          account.address,
          reservation,
          row.folder,
          gasMultiplier,
        )
      } catch (e) {
        console.error(
          `Unable to process reservation, launchpad_hash: ${launchpad.transaction.hash}, reservation_id: ${reservation.reservation_id}, error: ${(e as Error).message}`,
          e,
        )
      }
    }

    setTimeout(loop, 10000)
  }

  // loop
  loop()
}

main()
