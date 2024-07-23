import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
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

app.post('/inscription/upload', async (req, res) => {
  const { launchHash, contentType, extension } = req.body

  // @todo check permissions

  // check if launchpad exists
  const launchpad = await db('launchpad')
    .select()
    .where({ hash: launchHash })
    .first()
  if (!launchpad) {
    await db('launchpad').insert({ hash: launchHash })
  }

  // get max inscription number
  const maxInscriptionNumberRes = await db('launchpad_inscription')
    .max('inscription_number')
    .where({ launchpad_hash: launchHash })
    .first()

  const maxInscriptionNumber = (maxInscriptionNumberRes?.['max'] ?? 0) + 1
  const name = `${maxInscriptionNumber}.${extension}`

  // create launchpad inscription record
  await db('launchpad_inscription').insert({
    launchpad_hash: launchHash,
    inscription_number: maxInscriptionNumber,
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
  const metadataSignedUrl = await generateUploadURL(
    s3Client,
    config.S3_BUCKET,
    launchHash,
    `${maxInscriptionNumber}_metadata.json`,
    'application/json',
  )

  res.json({
    inscriptionNumber: maxInscriptionNumber,
    inscriptionSignedUrl,
    metadataSignedUrl,
  })
})

app.post('/inscription/confirm', async (req, res) => {
  const { launchHash, inscriptionNumber } = req.body

  // @todo check permissions

  // get inscription record
  const inscription = await db('launchpad_inscription')
    .select()
    .where({
      launchpad_hash: launchHash,
      inscription_number: inscriptionNumber,
    })
    .first()

  if (!inscription) {
    return res.status(404).json({ error: 'Inscription not found' })
  }

  // update inscription record
  await db('launchpad_inscription')
    .where({
      launchpad_hash: launchHash,
      inscription_number: inscriptionNumber,
    })
    .update({ uploaded: true })

  res.json({ success: true })
})
