import { AsteroidNeutronBridgeClient as AsteroidNeutronBridgeClientOriginal } from '@asteroid-protocol/sdk/contracts'
import type { ExecuteMsg } from '@asteroid-protocol/sdk/contracts'
import { Coin, StdFee } from '@cosmjs/stargate'
import { useMemo } from 'react'
import { useRootContext } from '~/context/root'
import useChain from './useChain'
import useCosmWasmClient, { SigningCosmWasmClient } from './useCosmWasmClient'

export class AsteroidNeutronBridgeClient extends AsteroidNeutronBridgeClientOriginal {
  declare client: SigningCosmWasmClient

  estimate(
    msg: ExecuteMsg,
    memo: string | undefined = '',
    fee: StdFee | 'auto' | number = 'auto',
    funds?: Coin[],
  ) {
    return this.client.estimateExecuteMsg(
      this.sender,
      this.contractAddress,
      msg,
      memo,
      fee,
      funds,
    )
  }

  execute(
    msg: ExecuteMsg,
    memo: string | undefined = '',
    fee: StdFee | 'auto' | number = 'auto',
    funds?: Coin[],
  ) {
    return this.client.execute(
      this.sender,
      this.contractAddress,
      msg,
      fee,
      memo,
      funds,
    )
  }
}

export default function useAsteroidBridgeClient() {
  const { neutronBridgeContract, neutronChainName } = useRootContext()
  const { address } = useChain(neutronChainName)
  const neutronClient = useCosmWasmClient(neutronChainName, '0.01untrn')

  return useMemo(() => {
    if (!neutronClient || !address) {
      return
    }

    return new AsteroidNeutronBridgeClient(
      neutronClient,
      address,
      neutronBridgeContract,
    )
  }, [neutronClient, address, neutronBridgeContract])
}
