import { SigningStargateClient, TxData } from '@asteroid-protocol/sdk'
import { StdFee } from '@cosmjs/amino'

export async function estimate(
  client: SigningStargateClient,
  address: string,
  txData: TxData,
  gasMultiplier = 1.6,
  feeMultiplier = 1.4,
) {
  const usedFee = await client.estimate(
    address,
    txData.messages,
    txData.memo,
    txData.nonCriticalExtensionOptions,
    gasMultiplier,
  )

  const amount = parseInt(usedFee.amount[0].amount) * feeMultiplier

  const fee: StdFee = {
    amount: [{ amount: amount.toFixed(), denom: 'uatom' }],
    gas: usedFee.gas,
  }

  return fee
}
