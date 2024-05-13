import { program } from 'commander'
import { Context, Options } from '../context.js'
import MarketplaceProtocol from '../metaprotocol/marketplace.js'
import { TxData } from '../metaprotocol/tx.js'
import { MarketplaceOperations } from '../operations/marketplace.js'
import {
  action,
  broadcastAndCheckTx,
  getOperationsOptions,
  getUserAddress,
  setupCommand,
} from './index.js'

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
      getUserAddress(context, options),
      context.api,
      getOperationsOptions(context.config, MarketplaceProtocol.DEFAULT_FEE),
    )
    return fn(context, operations)
  })
}

const marketplaceCommand = program.command('marketplace')

const MIN_DEPOSIT_PERCENT = 0.01
const TIMEOUT_BLOCKS = 100

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
    MIN_DEPOSIT_PERCENT.toString(),
  )
  .option(
    '-b, --timeout-blocks [DECIMALS]',
    'The block this reservation expires',
    TIMEOUT_BLOCKS.toString(),
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

interface MarketplaceListCollectionOptions extends Options {
  collection: string
  price: string
  minDeposit: string
  timeoutBlocks: string
}

setupCommand(marketplaceListCommand.command('collection'))
  .description('Creating a new listing for all collection inscriptions')
  .requiredOption(
    '-c, --collection [COLLECTION_SYMBOL]',
    'The collection symbol',
  )
  .requiredOption('-p, --price <PRICE>', 'The price in atom')
  .option(
    '-d, --min-deposit [MIN_DEPOSIT]',
    'The minimum deposit expressed as a percentage of total',
    MIN_DEPOSIT_PERCENT.toString(),
  )
  .option(
    '-b, --timeout-blocks [DECIMALS]',
    'The block this reservation expires',
    TIMEOUT_BLOCKS.toString(),
  )
  .action(async (options: MarketplaceListCollectionOptions) => {
    marketplaceAction(options, async (context, operations) => {
      const collectionId = await context.api.getCollectionId(options.collection)
      if (!collectionId) {
        throw new Error('Unknown collection')
      }

      const inscriptions = await context.api.getCollectionInscriptions(
        collectionId,
        getUserAddress(context, options),
      )
      for (const hash of inscriptions) {
        try {
          const txData = await operations.listInscription(
            hash,
            parseFloat(options.price),
            parseFloat(options.minDeposit),
            parseInt(options.timeoutBlocks),
          )
          await broadcastAndCheckTx(context, options, txData)
        } catch (err) {
          console.log('Error listing inscription', hash, err)
        }

        console.log('')
      }
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
    MIN_DEPOSIT_PERCENT.toString(),
  )
  .option(
    '-b, --timeout-blocks [DECIMALS]',
    'The block this reservation expires',
    TIMEOUT_BLOCKS.toString(),
  )
  .action(async (options: MarketplaceListInscriptionOptions) => {
    marketplaceAction(options, async (context, operations) => {
      return operations.listInscription(
        options.hash,
        parseFloat(options.price),
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
