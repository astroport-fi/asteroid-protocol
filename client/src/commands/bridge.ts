import { program } from 'commander'
import { Context, Options } from '../context.js'
import BridgeProtocol from '../metaprotocol/bridge.js'
import { TxData } from '../metaprotocol/tx.js'
import { BridgeOperations } from '../operations/bridge.js'
import {
  action,
  getOperationsOptions,
  getUserAddress,
  setupCommand,
} from './index.js'

async function bridgeAction(
  options: Options,
  fn: (
    context: Context,
    operations: BridgeOperations,
  ) => Promise<TxData | void>,
) {
  return action(options, (context) => {
    const operations = new BridgeOperations(
      context.network.chainId,
      getUserAddress(context, options),
      getOperationsOptions(context.config, BridgeProtocol.DEFAULT_FEE),
    )
    return fn(context, operations)
  })
}

const bridgeCommand = program.command('bridge')

interface BridgeEnableTokenOptions extends Options {
  ticker: string
  remoteChain: string
  remoteContract: string
}

setupCommand(bridgeCommand.command('enable'))
  .description('Enable a token for bridging')
  .requiredOption('-t, --ticker <TICKER>', 'The token ticker')
  .requiredOption('-c, --remoteChain <CHAINID>', 'The destination chain ID')
  .requiredOption(
    '-o, --remoteContract <CONTRACT>',
    'The bridge contract address on the destination chain',
  )
  .action(async (options: BridgeEnableTokenOptions) => {
    bridgeAction(options, async (context, operations) => {
      return operations.enable(
        options.ticker,
        options.remoteChain,
        options.remoteContract,
      )
    })
  })

interface BridgeSendOptions extends Options {
  ticker: string
  amount: string
  remoteChain: string
  remoteContract: string
  destination: string
}

setupCommand(bridgeCommand.command('send'))
  .description('Send tokens to another chain via a bridge')
  .requiredOption('-t, --ticker <TICKER>', 'The token ticker')
  .requiredOption('-m, --amount <AMOUNT>', 'The amount to transfer')
  .requiredOption('-c, --remoteChain <CHAINID>', 'The destination chain ID')
  .requiredOption(
    '-o, --remoteContract <CONTRACT>',
    'The bridge contract address on the destination chain',
  )
  .requiredOption(
    '-d, --destination <DESTINATION>',
    'The recipient address on the destination chain',
  )

  .action(async (options: BridgeSendOptions) => {
    bridgeAction(options, async (context, operations) => {
      return operations.send(
        options.ticker,
        parseFloat(options.amount),
        options.remoteChain,
        options.remoteContract,
        options.destination,
      )
    })
  })

interface BridgeRecvOptions extends Options {
  ticker: string
  amount: string
  remoteChain: string
  remoteSender: string
  destination: string
}

setupCommand(bridgeCommand.command('recv'))
  .description('Send tokens to another chain via a bridge')
  .requiredOption('-t, --ticker <TICKER>', 'The token ticker')
  .requiredOption('-m, --amount <AMOUNT>', 'The amount to transfer')
  .requiredOption('-c, --remoteChain <CHAINID>', 'The destination chain ID')
  .requiredOption(
    '-s, --remoteSender <SENDER>',
    'The bridge contract address on the destination chain',
  )
  .requiredOption(
    '-d, --destination <DESTINATION>',
    'The recipient address on the destination chain',
  )

  .action(async (options: BridgeRecvOptions) => {
    bridgeAction(options, async (context, operations) => {
      return operations.recv(
        options.ticker,
        parseFloat(options.amount),
        options.remoteChain,
        options.remoteSender,
        options.destination,
      )
    })
  })
