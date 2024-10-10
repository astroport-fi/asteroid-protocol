import { toUtf8 } from '@cosmjs/encoding'
import { program } from 'commander'
import { Context, Options } from '../context.js'
import TrollBoxProtocol from '../metaprotocol/trollbox.js'
import { TxData } from '../metaprotocol/tx.js'
import { TrollBoxOperations } from '../operations/trollbox.js'
import {
  action,
  getOperationsOptions,
  getUserAddress,
  setupCommand,
} from './index.js'

async function trollBoxAction(
  options: Options,
  fn: (
    context: Context,
    operations: TrollBoxOperations,
  ) => Promise<TxData | void>,
) {
  return action(options, (context) => {
    const operations = new TrollBoxOperations(
      context.network.chainId,
      getUserAddress(context, options),
      getOperationsOptions(context.config, TrollBoxProtocol.DEFAULT_FEE),
    )
    return fn(context, operations)
  })
}

const trollBoxCommand = program.command('trollbox')

interface PostOptions extends Options {
  text: string
}

setupCommand(trollBoxCommand.command('post'))
  .description('Create a new post')
  .requiredOption('-t, --text <TEXT>', 'The post text')
  .action(async (options: PostOptions) => {
    trollBoxAction(options, async (context, operations) => {
      return operations.post(toUtf8(options.text), {
        text: options.text,
        mime: 'text/plain',
      })
    })
  })

interface CollectOptions extends Options {
  hash: string
}

setupCommand(trollBoxCommand.command('collect'))
  .description('Collect a post')
  .requiredOption('-h, --hash <HASH>', 'The hash of the post')
  .action(async (options: CollectOptions) => {
    trollBoxAction(options, async (context, operations) => {
      return operations.collect(options.hash)
    })
  })
