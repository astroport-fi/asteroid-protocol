import { verifyADR36Amino } from '@keplr-wallet/cosmos'
import errorHandler from 'api-error-handler'
import bodyParser from 'body-parser'
import cors from 'cors'
import cuid from 'cuid'
import express from 'express'
import asyncHandler from 'express-async-handler'
import { loadConfig } from './config.js'
import { connect } from './db.js'
import { createS3Client, generateUploadURL } from './s3.js'

const app = express()
app.use(bodyParser.json())
app.use(cors())
const config = loadConfig()
const s3Client = createS3Client(config)
const db = connect(config.DATABASE_URL)

app.get('/', (req, res) => {
  res.send('hello world')
})

const server = app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`)
})

process.on('SIGINT', async function () {
  console.log('SIGINT signal received: closing HTTP server')
  server.close(() => {
    process.exit()
  })
})

process.on('SIGTERM', async function () {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    process.exit()
  })
})

interface InscriptionUrls {
  inscriptionSignedUrl: string
  metadataSignedUrl: string
}

interface InscriptionUrlsResponse extends InscriptionUrls {
  tokenId: number
}

function getMetadataUrl(launchHash: string, tokenId: number) {
  return generateUploadURL(
    s3Client,
    config.S3_BUCKET,
    launchHash,
    `${tokenId}_metadata.json`,
    'application/json',
  )
}

async function getInscriptionSignedUrls(
  launchHash: string,
  tokenId: number,
  name: string,
  contentType: string,
): Promise<InscriptionUrls> {
  // create launchpad inscription record
  await db('launchpad_inscription').insert({
    launchpad_hash: launchHash,
    inscription_number: tokenId,
    name,
  })

  // generate signed URLs
  const inscriptionSignedUrl = await generateUploadURL(
    s3Client,
    config.S3_BUCKET,
    launchHash,
    name,
    contentType,
  )
  const metadataSignedUrl = await getMetadataUrl(launchHash, tokenId)

  return {
    inscriptionSignedUrl,
    metadataSignedUrl,
  }
}

interface Inscription {
  tokenId: number
  filename: string
  contentType: string
}

app.post(
  '/create-session',
  asyncHandler(async (req, res) => {
    const { address } = req.body

    // check if session already exists
    const existingSession = await db('session')
      .select()
      .where({ address })
      .first()

    if (existingSession) {
      res.json({ hash: existingSession.hash })
      return
    }

    // create new session
    const hash = cuid()

    await db('session').insert({
      address,
      hash,
      date_created: new Date(),
      verified: false,
    })

    res.json({ hash })
  }),
)

app.post(
  '/verify-session',
  asyncHandler(async (req, res) => {
    const { hash, pubkey, signature } = req.body

    const session = await db('session').select().where({ hash }).first()

    if (!session) {
      res.status(404).json({ status: 404, message: 'Session not found' })
      return
    }

    const verified = verifyADR36Amino(
      'cosmos',
      session.address,
      hash,
      Buffer.from(pubkey, 'base64'),
      Buffer.from(signature, 'base64'),
    )

    if (!verified) {
      res
        .status(403)
        .json({ status: 403, message: 'Signature verification failed' })
      return
    }

    await db('session').where({ hash }).update({ verified: true })

    res.json({ success: true })
  }),
)

app.get(
  '/launchpads',
  asyncHandler(async (req, res) => {
    const launchpads = await db('launchpad_inscription')
      .select('launchpad_hash')
      .count({ total: 'inscription_number' })
      .count({ uploaded: db.raw('CASE WHEN uploaded THEN 1 END') })
      .groupBy('launchpad_hash')

    res.json(
      launchpads.map((launchpad) => ({
        launchpad_hash: launchpad.launchpad_hash,
        total: parseInt(launchpad.total as string),
        uploaded: parseInt(launchpad.uploaded as string),
      })),
    )
  }),
)

app.get(
  '/inscriptions/:launchHash',
  asyncHandler(async (req, res) => {
    const { launchHash } = req.params
    const inscriptions = await db('launchpad_inscription')
      .select()
      .where({ launchpad_hash: launchHash })
    res.json(inscriptions)
  }),
)

app.post(
  '/inscription/bulk/upload',
  asyncHandler(async (req, res) => {
    const { launchHash, inscriptions, sessionHash } = req.body as {
      launchHash: string
      inscriptions: Inscription[]
      sessionHash: string
    }

    // check session
    const session = await db('session')
      .select()
      .where({ hash: sessionHash ?? null, verified: true })
      .first()
    if (!session || !session.verified) {
      res.status(403).json({ status: 403, message: 'Invalid session' })
      return
    }

    // check if launchpad exists
    const launchpad = await db('launchpad')
      .select()
      .where({ hash: launchHash, creator: session.address })
      .first()
    if (!launchpad) {
      // @todo check if launchpad is owned by session address
      await db('launchpad').insert({
        hash: launchHash,
        creator: session.address,
      })
    }

    const urls: InscriptionUrlsResponse[] = []
    for (const inscription of inscriptions) {
      const { inscriptionSignedUrl, metadataSignedUrl } =
        await getInscriptionSignedUrls(
          launchHash,
          inscription.tokenId,
          inscription.filename,
          inscription.contentType,
        )
      urls.push({
        inscriptionSignedUrl,
        metadataSignedUrl,
        tokenId: inscription.tokenId,
      })
    }

    res.json({ urls })
  }),
)

app.post(
  '/inscription/bulk/confirm',
  asyncHandler(async (req, res) => {
    const { launchHash, tokenIds, sessionHash } = req.body as {
      launchHash: string
      tokenIds: number[]
      sessionHash: string
    }

    // check session
    const session = await db('session')
      .select()
      .where({ hash: sessionHash ?? null, verified: true })
      .first()
    if (!session || !session.verified) {
      res.status(403).json({ status: 403, message: 'Invalid session' })
      return
    }

    // check if launchpad exists
    const launchpad = await db('launchpad')
      .select()
      .where({ hash: launchHash, creator: session.address })
      .first()
    if (!launchpad) {
      res.status(404).json({ status: 404, message: 'Launchpad not found' })
      return
    }

    // update inscription records
    await db('launchpad_inscription')
      .whereIn('inscription_number', tokenIds)
      .andWhere({ launchpad_hash: launchHash })
      .update({ uploaded: true })

    res.json({ success: true })
  }),
)

app.post(
  '/inscription/upload',
  asyncHandler(async (req, res) => {
    const { launchHash, contentType, extension, sessionHash } = req.body

    // check session
    const session = await db('session')
      .select()
      .where({ hash: sessionHash ?? null, verified: true })
      .first()
    if (!session || !session.verified) {
      res.status(403).json({ status: 403, message: 'Invalid session' })
      return
    }

    // check if launchpad exists
    const launchpad = await db('launchpad')
      .select()
      .where({ hash: launchHash, creator: session.address })
      .first()
    if (!launchpad) {
      // @todo check if launchpad is owned by session address
      await db('launchpad').insert({
        hash: launchHash,
        creator: session.address,
      })
    }

    // get max inscription number
    const maxTokenIdRes = await db('launchpad_inscription')
      .max('inscription_number')
      .where({ launchpad_hash: launchHash })
      .first()

    const maxTokenId = (maxTokenIdRes?.['max'] ?? 0) + 1
    const name = `${maxTokenId}.${extension}`

    const { inscriptionSignedUrl, metadataSignedUrl } =
      await getInscriptionSignedUrls(launchHash, maxTokenId, name, contentType)

    res.json({
      tokenId: maxTokenId,
      inscriptionSignedUrl,
      metadataSignedUrl,
    } as InscriptionUrlsResponse)
  }),
)

app.post(
  '/inscription/edit',
  asyncHandler(async (req, res) => {
    const { launchHash, tokenId, sessionHash } = req.body

    // check session
    const session = await db('session')
      .select()
      .where({ hash: sessionHash ?? null, verified: true })
      .first()
    if (!session || !session.verified) {
      res.status(403).json({ status: 403, message: 'Invalid session' })
      return
    }

    // check if launchpad exists
    const launchpad = await db('launchpad')
      .select()
      .where({ hash: launchHash, creator: session.address })
      .first()
    if (!launchpad) {
      res.status(404).json({ status: 404, message: 'Launchpad not found' })
      return
    }

    // get inscription record
    const inscription = await db('launchpad_inscription')
      .select()
      .where({
        launchpad_hash: launchHash,
        inscription_number: tokenId,
      })
      .first()

    if (!inscription) {
      res.status(404).json({ status: 404, message: 'Inscription not found' })
      return
    }

    const metadataSignedUrl = await getMetadataUrl(launchHash, tokenId)

    res.json({ metadataSignedUrl })
  }),
)

app.post(
  '/inscription/confirm',
  asyncHandler(async (req, res) => {
    const { launchHash, tokenId, sessionHash } = req.body

    // check session
    const session = await db('session')
      .select()
      .where({ hash: sessionHash ?? null, verified: true })
      .first()
    if (!session || !session.verified) {
      res.status(403).json({ status: 403, message: 'Invalid session' })
      return
    }

    // check if launchpad exists
    const launchpad = await db('launchpad')
      .select()
      .where({ hash: launchHash, creator: session.address })
      .first()

    if (!launchpad) {
      res.status(404).json({ status: 404, message: 'Launchpad not found' })
      return
    }

    // get inscription record
    const inscription = await db('launchpad_inscription')
      .select()
      .where({
        launchpad_hash: launchHash,
        inscription_number: tokenId,
      })
      .first()

    if (!inscription) {
      res.status(404).json({ status: 404, message: 'Inscription not found' })
      return
    }

    // update inscription record
    await db('launchpad_inscription')
      .where({
        launchpad_hash: launchHash,
        inscription_number: tokenId,
      })
      .update({ uploaded: true })

    res.json({ success: true })
  }),
)

app.use(errorHandler())
