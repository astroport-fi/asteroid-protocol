import { program } from 'commander'
import { Options } from '../context.js'
import { getGrantSendMsg } from '../msg/auth.js'
import { action, setupCommand } from './index.js'

const grantCommand = program.command('grant')

interface GrantSendMsgOptions extends Options {
  grantee: string
  amount: string
}

setupCommand(grantCommand.command('approve').command('send'))
  .description(
    'Grant permission to grantee (for example bot) to perform send message on behalf of granter (user)',
  )
  .requiredOption('-g, --grantee <GRANTEE>', 'The grantee address')
  .requiredOption('-m, --amount <AMOUNT>', 'The granted amount in uatom')
  .action(async (options: GrantSendMsgOptions) => {
    action(
      options,
      async (context) => {
        console.log('Granting permission!')

        const grant = getGrantSendMsg(
          context.account.address,
          options.grantee,
          {
            allowList: [context.account.address],
            spendLimit: [{ denom: 'uatom', amount: options.amount }],
          },
        )
        const res = await context.client.signAndBroadcast(
          context.account.address,
          [grant],
          1.7,
        )
        if (res.code) {
          throw new Error(`Transaction failed with error code ${res.code}`)
        }
        console.log(`${context.network.explorer}${res.transactionHash}`)
        return
      },
      false,
    )
  })
