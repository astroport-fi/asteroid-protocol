import { program } from 'commander'
import fs from 'fs/promises'
import mime from 'mime'
import { Context, Options } from '../context.js'
import CFT20Protocol from '../metaprotocol/cft20.js'
import { TxData } from '../metaprotocol/tx.js'
import { CFT20Operations } from '../operations/cft20.js'
import {
  action,
  getOperationsOptions,
  getUserAddress,
  setupCommand,
} from './index.js'

async function cft20Action(
  options: Options,
  fn: (context: Context, operations: CFT20Operations) => Promise<TxData | void>,
) {
  return action(options, (context) => {
    const operations = new CFT20Operations(
      context.network.chainId,
      getUserAddress(context, options),
      getOperationsOptions(context.config, CFT20Protocol.DEFAULT_FEE),
    )
    return fn(context, operations)
  })
}

const cft20Command = program.command('cft20')

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
