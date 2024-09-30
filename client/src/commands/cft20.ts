import { program } from 'commander'
import fs from 'fs/promises'
import mime from 'mime'
import { Context, Options } from '../context.js'
import CFT20Protocol from '../metaprotocol/cft20.js'
import { TxData } from '../metaprotocol/tx.js'
import { CFT20Operations, DeployParams } from '../operations/cft20.js'
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
  preMine?: string
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
  .option('-p, --pre-mine [PRE_MINE]', 'The amount to pre-mine')
  .action(async (options: CFT20DeployOptions) => {
    cft20Action(options, async (context, operations) => {
      const mimeType = mime.getType(options.logoPath)
      if (!mimeType) {
        throw new Error('Unknown mime type')
      }
      const data = await fs.readFile(options.logoPath)
      const params: DeployParams = {
        ticker: options.ticker.toUpperCase(),
        name: options.name,
        decimals: parseInt(options.decimals),
        maxSupply: parseInt(options.supply),
        mintLimit: parseInt(options.mintLimit),
        openTime: new Date(),
      }
      if (options.preMine) {
        params.preMine = parseInt(options.preMine)
      }
      return operations.deploy(data, mimeType, params)
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

interface CFT20BurnOptions extends Options {
  ticker: string
  amount: string
  destination: string
}

setupCommand(cft20Command.command('burn'))
  .description('Burn a token')
  .requiredOption('-t, --ticker <TICKER>', 'The token ticker')
  .requiredOption('-m, --amount <AMOUNT>', 'The amount to burn')
  .requiredOption('-d, --destination <DESTINATION>', 'The address to burn to')

  .action(async (options: CFT20BurnOptions) => {
    cft20Action(options, async (context, operations) => {
      return operations.burn(options.ticker, parseInt(options.amount, 10))
    })
  })
