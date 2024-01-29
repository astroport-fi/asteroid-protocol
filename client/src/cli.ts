#!/usr/bin/env node
import { Command, program } from 'commander'
import fs from 'fs/promises'
import mime from 'mime'
import { Context, Options, createContext } from './context.js'
import { TxData, broadcastTx } from './metaprotocol/tx.js'
import { CFT20Operations } from './operations/cft20.js'
import { InscriptionOperations } from './operations/inscription.js'
import { MarketplaceOperations } from './operations/marketplace.js'

export function setupCommand(command?: Command) {
  if (!command) {
    command = new Command()
  }
  command.option(
    '-n, --network <NETWORK_NAME>',
    'Name of the network to use',
    'local',
  )
  command.option(
    '-a, --account <ACCOUNT_NAME>',
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
  fn: (context: Context) => Promise<TxData>,
) {
  const context = await createContext(options)
  const txData = await fn(context)
  const res = await broadcastTx(context.client, context.account.address, txData)
  console.log(`${context.network.explorer}${res.transactionHash}`)
}

async function inscriptionAction(
  options: Options,
  fn: (context: Context, operations: InscriptionOperations) => Promise<TxData>,
) {
  return action(options, (context) => {
    const operations = new InscriptionOperations(
      context.network.chainId,
      context.account.address,
    )
    return fn(context, operations)
  })
}

async function cft20Action(
  options: Options,
  fn: (context: Context, operations: CFT20Operations) => Promise<TxData>,
) {
  return action(options, (context) => {
    const operations = new CFT20Operations(
      context.network.chainId,
      context.account.address,
    )
    return fn(context, operations)
  })
}

async function marketplaceAction(
  options: Options,
  fn: (context: Context, operations: MarketplaceOperations) => Promise<TxData>,
) {
  return action(options, (context) => {
    const operations = new MarketplaceOperations(
      context.network.chainId,
      context.account.address,
    )
    return fn(context, operations)
  })
}

interface InscriptionOptions extends Options {
  dataPath: string
  name: string
  description: string
}

setupCommand(inscriptionCommand.command('inscribe'))
  .description('Create a new inscription')
  .requiredOption('-p, --data-path <DATA_PATH>', 'Inscription data path')
  .requiredOption('-i, --name <NAME>', 'Inscription name')
  .requiredOption('-d, --description <DESCRIPTION>', 'Inscription description')
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
      return operations.inscribe(data, metadata)
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
  .option('-d, --decimals <DECIMALS>', 'The decimals for the token', '6')
  .option(
    '-m, --mint-limit <MINT_LIMIT>',
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
        ticker: options.ticker,
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

interface MarkeplaceListCFT20Options extends Options {
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
    '-d, --min-deposit <MIN_DEPOSIT>',
    'The minimum deposit expressed as a percentage of total',
    '10',
  )
  .option(
    '-b, --timeout-blocks <DECIMALS>',
    'The block this reservation expires',
    '50',
  )
  .action(async (options: MarkeplaceListCFT20Options) => {
    marketplaceAction(options, async (context, operations) => {
      return operations.listCFT20(
        options.ticker,
        parseInt(options.amount, 10),
        parseFloat(options.price),
        parseInt(options.minDeposit),
        parseInt(options.timeoutBlocks),
      )
    })
  })

program.parseAsync()
