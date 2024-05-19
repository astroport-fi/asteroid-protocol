import { AsteroidNeutronBridgeClient as AsteroidNeutronBridgeClientOriginal } from '@asteroid-protocol/sdk/contracts'
import type { ExecuteMsg } from '@asteroid-protocol/sdk/contracts'
import { Coin, StdFee } from '@cosmjs/stargate'
import { useMemo } from 'react'
import { useRootContext } from '~/context/root'
import useChain from '~/hooks/useChain'
import useCosmWasmClient, {
  SigningCosmWasmClient,
} from '~/hooks/useCosmWasmClient'

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

interface ClientState {
  client: AsteroidNeutronBridgeClient | null
  error: Error | null
  isLoading: boolean
}

export default function useAsteroidBridgeClient(): ClientState {
  const { neutronBridgeContract, neutronChainName } = useRootContext()
  const { address } = useChain(neutronChainName)
  const neutronClientState = useCosmWasmClient(neutronChainName, '0.01untrn')

  return useMemo(() => {
    if (!address || neutronClientState.isLoading) {
      return { client: null, error: null, isLoading: true }
    }

    if (!neutronClientState.client || neutronClientState.error) {
      return {
        client: null,
        error: neutronClientState.error ?? new Error('invalid neutron client'),
        isLoading: false,
      }
    }

    const client = new AsteroidNeutronBridgeClient(
      neutronClientState.client,
      address,
      neutronBridgeContract,
    )
    return { client, error: null, isLoading: false }
  }, [neutronClientState, address, neutronBridgeContract])
}
