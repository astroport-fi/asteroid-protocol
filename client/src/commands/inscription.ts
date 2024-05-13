import { program } from 'commander'
import fs from 'fs/promises'
import mime from 'mime'
import path from 'path'
import { inferSchema, initParser } from 'udsv'
import { Context, Options } from '../context.js'
import InscriptionProtocol, {
  CollectionMetadata,
  MigrationData,
  NFTMetadata,
  Trait,
} from '../metaprotocol/inscription.js'
import { TxData } from '../metaprotocol/tx.js'
import { InscriptionOperations } from '../operations/inscription.js'
import { readCSV } from '../utils/csv.js'
import {
  action,
  broadcastAndCheckTx,
  getOperationsOptions,
  getUserAddress,
  setupCommand,
} from './index.js'

async function inscriptionAction(
  options: Options,
  fn: (
    context: Context,
    operations: InscriptionOperations,
  ) => Promise<TxData | void>,
) {
  return action(options, (context) => {
    const operations = new InscriptionOperations(
      context.network.chainId,
      getUserAddress(context, options),
      getOperationsOptions(context.config, InscriptionProtocol.DEFAULT_FEE),
    )
    return fn(context, operations)
  })
}

const inscriptionCommand = program.command('inscription')

interface InscriptionOptions extends Options {
  dataPath: string
  name: string
  description: string
  collection?: string
}

setupCommand(inscriptionCommand.command('inscribe'))
  .description('Create a new inscription')
  .requiredOption('-p, --data-path <DATA_PATH>', 'Inscription data path')
  .requiredOption('-i, --name <NAME>', 'Inscription name')
  .requiredOption('-d, --description <DESCRIPTION>', 'Inscription description')
  .option('-c, --collection [COLLECTION]', 'The collection transaction hash')
  .action(async (options: InscriptionOptions) => {
    inscriptionAction(options, async (context, operations) => {
      const mimeType = mime.getType(options.dataPath)
      if (!mimeType) {
        throw new Error('Unknown mime type')
      }
      const data = await fs.readFile(options.dataPath)
      const metadata = {
        description: options.description,
        name: options.name,
        mime: mimeType,
      }
      if (options.collection) {
        return operations.inscribeCollectionInscription(
          options.collection,
          data,
          metadata,
        )
      }

      return operations.inscribe(data, metadata)
    })
  })

interface CollectionOptions extends Omit<InscriptionOptions, 'collection'> {
  symbol: string
}

setupCommand(inscriptionCommand.command('collection'))
  .description('Create a new collection')
  .requiredOption('-s, --symbol <SYMBOL>', 'Collection symbol')
  .requiredOption('-p, --data-path <DATA_PATH>', 'Inscription data path')
  .requiredOption('-i, --name <NAME>', 'Inscription name')
  .requiredOption('-d, --description <DESCRIPTION>', 'Inscription description')
  .action(async (options: CollectionOptions) => {
    inscriptionAction(options, async (context, operations) => {
      const mimeType = mime.getType(options.dataPath)
      if (!mimeType) {
        throw new Error('Unknown mime type')
      }
      const data = await fs.readFile(options.dataPath)
      const metadata: CollectionMetadata = {
        description: options.description,
        name: options.name,
        mime: mimeType,
        symbol: options.symbol.toUpperCase(),
      }
      return operations.inscribe(data, metadata)
    })
  })

interface InscribeCSVOptions extends Options {
  csvPath: string
  collection: string
}

const ALLOWED_CHARACTERS_INFO = `
  Trait name allowed characters
  - a lowercase letter (a-z),
  - an uppercase letter (A-Z),
  - a digit (0-9),
  - a hyphen (-)
  - a space ( )

  Trait value allowed characters
  - a lowercase letter (a-z),
  - an uppercase letter (A-Z),
  - a digit (0-9),
  - a hyphen (-)
  - a period (.)
  - a space ( )
  `

setupCommand(inscriptionCommand.command('inscribe-csv'))
  .description('Create inscriptions from Metadata CSV and images/files')
  .requiredOption('-p, --csv-path <CSV_PATH>', 'Metadata CSV path')
  .option('-c, --collection [COLLECTION_SYMBOL]', 'The collection symbol')
  .action(async (options: InscribeCSVOptions) => {
    inscriptionAction(options, async (context, operations) => {
      const rows = await readCSV(options.csvPath)
      const dir = path.dirname(options.csvPath)
      const traitNameRegex = /^[a-zA-Z0-9- ]+$/
      const traitValueRegex = /^[a-zA-Z0-9-. ]+$/

      for (const row of rows) {
        const attributes: Trait[] = []
        let name = ''
        let description = ''
        let filePath = ''

        for (const [key, value] of Object.entries(row)) {
          if (key == 'name') {
            name = value
          } else if (key == 'description') {
            description = value
          } else if (key == 'file') {
            filePath = path.join(dir, value)
          } else {
            if (!traitNameRegex.test(key)) {
              console.log(ALLOWED_CHARACTERS_INFO)
              throw new Error('Invalid trait name')
            }
            if (!traitValueRegex.test(value)) {
              console.log(ALLOWED_CHARACTERS_INFO)
              throw new Error('Invalid trait value')
            }
            attributes.push({ trait_type: key, value })
          }
        }

        console.log('File:', filePath)
        const mimeType = mime.getType(filePath)
        if (!mimeType) {
          throw new Error('Unknown mime type')
        }
        const data = await fs.readFile(filePath)
        const metadata: NFTMetadata = {
          description: description,
          name,
          mime: mimeType,
          attributes,
        }

        console.log('Metadata', metadata)

        let txData: TxData
        if (options.collection) {
          const collectionHash = await context.api.getCollectionHash(
            options.collection,
          )
          if (!collectionHash) {
            throw new Error('Unknown collection')
          }

          console.log(
            'Collection hash:',
            collectionHash,
            '\nCollection Symbol:',
            options.collection,
          )

          txData = operations.inscribeCollectionInscription(
            collectionHash,
            data,
            metadata,
          )
        } else {
          txData = operations.inscribe(data, metadata)
        }

        await broadcastAndCheckTx(context, options, txData)
        console.log('')
      }
    })
  })

interface InscriptionTransferOptions extends Options {
  hash: string
  destination: string
}

setupCommand(inscriptionCommand.command('transfer'))
  .description('Transfer an inscription')
  .requiredOption(
    '-h, --hash <HASH>',
    'The transaction hash containing the inscription',
  )
  .requiredOption(
    '-d, --destination <DESTINATION>',
    'The address to transfer to',
  )
  .action(async (options: InscriptionTransferOptions) => {
    inscriptionAction(options, async (context, operations) => {
      return operations.transfer(options.hash, options.destination)
    })
  })

interface GrantMigrationPermissionOptions extends Options {
  hashes: string[]
  grantee: string
}

setupCommand(inscriptionCommand.command('grant-migration-permission'))
  .description('Grant Migration Permission')
  .requiredOption(
    '-h, --hashes <HASH...>',
    'The transaction hashes containing the inscription(s)',
  )
  .requiredOption('-g, --grantee <grantee>', 'The grantee address')
  .action(async (options: GrantMigrationPermissionOptions) => {
    inscriptionAction(options, async (context, operations) => {
      for (const hash of options.hashes) {
        const txData = operations.grantMigrationPermission(
          hash,
          options.grantee,
        )

        await broadcastAndCheckTx(context, options, txData)
      }
    })
  })

interface MigrateInscriptionsOptions extends Options {
  csvPath: string
  collection: string
}

setupCommand(inscriptionCommand.command('migrate'))
  .description('Migrate inscriptions')
  .requiredOption('-p, --csv-path <CSV_PATH>', 'Metadata CSV path')
  .option('-c, --collection [COLLECTION]', 'The collection transaction hash')
  .action(async (options: MigrateInscriptionsOptions) => {
    inscriptionAction(options, async (context, operations) => {
      const csvStr = await fs.readFile(options.csvPath, 'utf8')

      const schema = inferSchema(csvStr, { trim: true, col: ',' })
      const parser = initParser(schema)

      const metadata: MigrationData = {
        header: schema.cols.map((col) => col.name),
        rows: parser.stringArrs(csvStr).filter((row: string[]) => !!row[0]),
      }
      if (options.collection) {
        metadata.collection = options.collection
      }

      return operations.migrate(metadata)
    })
  })

interface UpdateCollectionOptions extends Options {
  collection: string
  royaltyPercentage: string
  paymentAddress: string
  description: string
  twitter?: string
  telegram?: string
  discord?: string
  website?: string
}

setupCommand(inscriptionCommand.command('update-collection'))
  .description('Update collection metadata')
  .requiredOption(
    '-c, --collection <COLLECTION_SYMBOL>',
    'The collection symbol',
  )
  .option('-r, --royalty-percentage [PERCENTAGE]', 'Royalty percentage')
  .option('-p, --payment-address [PAYMENT_ADDRESS]', 'Payment address')
  .option('-d, --description [DESCRIPTION]', 'Description')
  .option('-t, --twitter [TWITTER]', 'Twitter')
  .option('-g, --telegram [TELEGRAM]', 'Telegram')
  .option('-s, --discord [DISCORD]', 'Discord')
  .option('-w, --website [WEBSITE]', 'Website')
  .action(async (options: UpdateCollectionOptions) => {
    inscriptionAction(options, async (context, operations) => {
      const collectionHash = await context.api.getCollectionHash(
        options.collection,
      )
      if (!collectionHash) {
        throw new Error('Unknown collection')
      }

      const metadata: Partial<CollectionMetadata> = {}
      if (options.royaltyPercentage) {
        metadata.royalty_percentage =
          parseFloat(options.royaltyPercentage) / 100
      }

      if (options.paymentAddress) {
        metadata.payment_address = options.paymentAddress
      }

      if (options.description) {
        metadata.description = options.description
      }

      if (options.twitter) {
        metadata.twitter = options.twitter
      }

      if (options.telegram) {
        metadata.telegram = options.telegram
      }

      if (options.discord) {
        metadata.discord = options.discord
      }

      if (options.website) {
        metadata.website = options.website
      }

      if (Object.keys(metadata).length === 0) {
        throw new Error('No metadata to update')
      }

      return operations.updateCollection(collectionHash, metadata)
    })
  })
