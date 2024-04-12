#!/usr/bin/env node
import { Command, program } from 'commander'
import fs from 'fs/promises'
import mime from 'mime'
import path from 'path'
import { inferSchema, initParser } from 'udsv'
import { Context, Options, createContext } from './context.js'
import {
  CollectionMetadata,
  MigrationData,
  NFTMetadata,
  Trait,
} from './metaprotocol/inscription.js'
import { TxData, broadcastTx } from './metaprotocol/tx.js'
import { CFT20Operations } from './operations/cft20.js'
import { InscriptionOperations } from './operations/inscription.js'
import { MarketplaceOperations } from './operations/marketplace.js'
import { readCSV } from './utils/csv.js'
import { checkTx } from './utils/tx.js'

async function broadcastAndCheckTx(context: Context, txData: TxData) {
  const res = await broadcastTx(
    context.client,
    context.account.address,
    txData,
    context.config.feeMultiplier,
  )
  console.log(`${context.network.explorer}${res.transactionHash}`)
  await checkTx(context.api, res)
  console.log('Transaction was successfully indexed')
}

export function setupCommand(command?: Command) {
  if (!command) {
    command = new Command()
  }
  command.option(
    '-n, --network [NETWORK_NAME]',
    'Name of the network to use',
    'local',
  )
  command.option(
    '-a, --account [ACCOUNT_NAME]',
    'Name of the account to use as transaction signer',
  )
  return command
}

program.name('asteroid').version('0.1.0')

const inscriptionCommand = program.command('inscription')
const cft20Command = program.command('cft20')
const marketplaceCommand = program.command('marketplace')

async function action(
  options: Options,
  fn: (context: Context) => Promise<TxData | void>,
) {
  const context = await createContext(options)
  const txData = await fn(context)
  if (txData) {
    await broadcastAndCheckTx(context, txData)
  } else {
    console.warn('No tx data')
  }
}

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
      context.account.address,
      { useExtensionData: context.config.useExtensionData, multi: false },
    )
    return fn(context, operations)
  })
}

async function cft20Action(
  options: Options,
  fn: (context: Context, operations: CFT20Operations) => Promise<TxData | void>,
) {
  return action(options, (context) => {
    const operations = new CFT20Operations(
      context.network.chainId,
      context.account.address,
      { useExtensionData: context.config.useExtensionData, multi: false },
    )
    return fn(context, operations)
  })
}

async function marketplaceAction(
  options: Options,
  fn: (
    context: Context,
    operations: MarketplaceOperations,
  ) => Promise<TxData | void>,
) {
  return action(options, (context) => {
    const operations = new MarketplaceOperations(
      context.network.chainId,
      context.account.address,
      context.api,
      { useExtensionData: context.config.useExtensionData, multi: false },
    )
    return fn(context, operations)
  })
}

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

        await broadcastAndCheckTx(context, txData)
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

        await broadcastAndCheckTx(context, txData)
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

interface CFT20DeployOptions extends Options {
  ticker: string
  name: string
  decimals: string
  supply: string
  logoPath: string
  mintLimit: string
}

setupCommand(cft20Command.command('deploy'))
  .description('Create a new token')
  .requiredOption('-t, --ticker <TICKER>', 'The address to transfer to')
  .requiredOption('-i, --name <NAME>', 'The The name of the token')
  .requiredOption('-s, --supply <SUPPLY>', 'The max supply of the token')
  .requiredOption('-l, --logo-path <LOGO_PATH>', 'Inscription data path')
  .option('-d, --decimals [DECIMALS]', 'The decimals for the token', '6')
  .option(
    '-m, --mint-limit [MINT_LIMIT]',
    'The maximum tokens that can be minted per transaction',
    '1000',
  )
  .action(async (options: CFT20DeployOptions) => {
    cft20Action(options, async (context, operations) => {
      const mimeType = mime.getType(options.logoPath)
      if (!mimeType) {
        throw new Error('Unknown mime type')
      }
      const data = await fs.readFile(options.logoPath)
      return operations.deploy(data, mimeType, {
        ticker: options.ticker.toUpperCase(),
        name: options.name,
        decimals: parseInt(options.decimals),
        maxSupply: parseInt(options.supply),
        mintLimit: parseInt(options.mintLimit),
        openTime: new Date(),
      })
    })
  })

interface CFT20MintOptions extends Options {
  ticker: string
  amount: string
}

setupCommand(cft20Command.command('mint'))
  .description('Mint a token')
  .requiredOption('-t, --ticker <TICKER>', 'The address to transfer to')
  .requiredOption('-m, --amount <AMOUNT>', 'The amount to transfer')
  .action(async (options: CFT20MintOptions) => {
    cft20Action(options, async (context, operations) => {
      return operations.mint(options.ticker, parseInt(options.amount))
    })
  })

interface CFT20TransferOptions extends Options {
  ticker: string
  amount: string
  destination: string
}

setupCommand(cft20Command.command('transfer'))
  .description('Transfer a token')
  .requiredOption('-t, --ticker <TICKER>', 'The token ticker')
  .requiredOption('-m, --amount <AMOUNT>', 'The amount to transfer')
  .requiredOption(
    '-d, --destination <DESTINATION>',
    'The address to transfer to',
  )

  .action(async (options: CFT20TransferOptions) => {
    cft20Action(options, async (context, operations) => {
      return operations.transfer(
        options.ticker,
        parseInt(options.amount, 10),
        options.destination,
      )
    })
  })

interface MarketplaceListCFT20Options extends Options {
  ticker: string
  amount: string
  price: string
  minDeposit: string
  timeoutBlocks: string
}

const marketplaceListCommand = marketplaceCommand.command('list')

setupCommand(marketplaceListCommand.command('cft20'))
  .description('Creating a new listing for CFT-20 tokens')
  .requiredOption('-t, --ticker <TICKER>', 'The token ticker')
  .requiredOption('-m, --amount <AMOUNT>', 'The amount being sold')
  .requiredOption('-p, --price <PRICE>', 'The price per token in atom')
  .option(
    '-d, --min-deposit [MIN_DEPOSIT]',
    'The minimum deposit expressed as a percentage of total',
    '0.1',
  )
  .option(
    '-b, --timeout-blocks [DECIMALS]',
    'The block this reservation expires',
    '50',
  )
  .action(async (options: MarketplaceListCFT20Options) => {
    marketplaceAction(options, async (context, operations) => {
      return operations.listCFT20(
        options.ticker,
        parseInt(options.amount, 10),
        parseFloat(options.price),
        parseFloat(options.minDeposit),
        parseInt(options.timeoutBlocks),
      )
    })
  })

interface MarketplaceListInscriptionOptions extends Options {
  hash: string
  price: string
  minDeposit: string
  timeoutBlocks: string
}

setupCommand(marketplaceListCommand.command('inscription'))
  .description('Creating a new listing for an inscription')
  .requiredOption(
    '-h, --hash <HASH>',
    'The transaction hash containing the inscription',
  )
  .requiredOption('-p, --price <PRICE>', 'The price in atom')
  .option(
    '-d, --min-deposit [MIN_DEPOSIT]',
    'The minimum deposit expressed as a percentage of total',
    '0.1',
  )
  .option(
    '-b, --timeout-blocks [DECIMALS]',
    'The block this reservation expires',
    '50',
  )
  .action(async (options: MarketplaceListInscriptionOptions) => {
    marketplaceAction(options, async (context, operations) => {
      return operations.listInscription(
        options.hash,
        parseInt(options.price, 10),
        parseFloat(options.minDeposit),
        parseInt(options.timeoutBlocks),
      )
    })
  })

interface MarketplaceHashOptions extends Options {
  hash: string
}
setupCommand(marketplaceCommand.command('deposit'))
  .description('Reserve a listing for purchase')
  .requiredOption('-h, --hash <HASH>', 'The listing transaction hash')
  .action(async (options: MarketplaceHashOptions) => {
    marketplaceAction(options, async (context, operations) => {
      return operations.deposit(options.hash)
    })
  })

const marketplaceBuyCommand = marketplaceCommand.command('buy')

setupCommand(marketplaceBuyCommand.command('cft20'))
  .description('Buy a listing, the listing must be reserved first')
  .requiredOption('-h, --hash <HASH>', 'The listing transaction hash')
  .action(async (options: MarketplaceHashOptions) => {
    marketplaceAction(options, async (context, operations) => {
      return operations.buy(options.hash, 'cft20')
    })
  })

setupCommand(marketplaceBuyCommand.command('inscription'))
  .description('Buy a listing, the listing must be reserved first')
  .requiredOption('-h, --hash <HASH>', 'The listing transaction hash')
  .action(async (options: MarketplaceHashOptions) => {
    marketplaceAction(options, async (context, operations) => {
      return operations.buy(options.hash, 'inscription')
    })
  })

setupCommand(marketplaceCommand.command('delist'))
  .description('Removing a listing')
  .requiredOption('-h, --hash <HASH>', 'The listing transaction hash')
  .action(async (options: MarketplaceHashOptions) => {
    marketplaceAction(options, async (context, operations) => {
      return operations.delist(options.hash)
    })
  })

program.parseAsync()
