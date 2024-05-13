import { Command, program } from 'commander'
import { readPackageSync } from 'read-pkg'
import { Config } from '../config.js'
import { Context, Options, createContext } from '../context.js'
import { TxData, broadcastTx } from '../metaprotocol/tx.js'
import { ProtocolFee } from '../metaprotocol/types.js'
import { getExecSendGrantMsg } from '../msg/auth.js'
import { Options as OperationsOptions } from '../operations/index.js'
import { checkTx } from '../utils/tx.js'

const pkg = readPackageSync()
program.name('asteroid').version(pkg.version)

export async function broadcastAndCheckTx(
  context: Context,
  options: Options,
  txData: TxData,
) {
  if (options.granter) {
    console.log('Performing grant transaction!')
    const msgs = txData.messages.map((msg) =>
      getExecSendGrantMsg(context.account.address, msg.value),
    )
    txData.messages = msgs
  }

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

export async function action(
  options: Options,
  fn: (context: Context) => Promise<TxData | void>,
  warn = true,
) {
  const context = await createContext(options)
  const txData = await fn(context)
  if (txData) {
    await broadcastAndCheckTx(context, options, txData)
  } else if (warn) {
    console.warn('No tx data')
  }
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
  command.option('--granter [GRANTER]', 'Address of the granter account')

  return command
}

export function getFee(
  fee: ProtocolFee,
  useIbc: boolean,
  receiver: string,
): ProtocolFee | undefined {
  if (useIbc) {
    return
  }

  return { ...fee, receiver }
}

export function getUserAddress(context: Context, options: Options): string {
  return options.granter || context.account.address
}

export function getOperationsOptions(
  config: Config,
  fee: ProtocolFee,
): OperationsOptions<false> {
  return {
    useExtensionData: config.useExtensionData,
    multi: false,
    useIbc: config.useIbc,
    fee: getFee(fee, config.useIbc, config.feeReceiver),
  }
}
