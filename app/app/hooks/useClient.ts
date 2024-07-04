import { SigningStargateClient, TxData } from '@asteroid-protocol/sdk'
import { StdFee } from '@cosmjs/amino'
import { GasPrice } from '@cosmjs/stargate'
import { useEffect, useState } from 'react'
import { useRootContext } from '~/context/root'
import useOfflineSigner from '~/hooks/useOfflineSigner'
import useChain from './useChain'

export class SigningClient {
  client: SigningStargateClient
  address: string
  gasMultiplier: number
  feeMultiplier: number

  constructor(
    client: SigningStargateClient,
    address: string,
    gasMultiplier = 1.6,
    feeMultiplier = 1.4,
  ) {
    this.client = client
    this.address = address
    this.gasMultiplier = gasMultiplier
    this.feeMultiplier = feeMultiplier
  }

  async simulate(txData: TxData) {
    return this.client.simulate(
      this.address,
      txData.messages,
      txData.memo,
      txData.nonCriticalExtensionOptions,
    )
  }

  async estimate(txData: TxData) {
    const usedFee = await this.client.estimate(
      this.address,
      txData.messages,
      txData.memo,
      txData.nonCriticalExtensionOptions,
      this.gasMultiplier,
    )

    const amount = parseInt(usedFee.amount[0].amount) * this.feeMultiplier

    const fee: StdFee = {
      amount: [{ amount: amount.toFixed(), denom: 'uatom' }],
      gas: usedFee.gas,
    }

    return fee
  }

  async signAndBroadcast(txData: TxData, fee?: StdFee) {
    return this.client.signAndBroadcast(
      this.address,
      txData.messages,
      fee ?? this.gasMultiplier,
      txData.memo,
      undefined,
      txData.nonCriticalExtensionOptions,
    )
  }

  async signAndBroadcastSync(txData: TxData, fee?: StdFee) {
    return this.client.signAndBroadcastSync(
      this.address,
      txData.messages,
      fee ?? this.gasMultiplier,
      txData.memo,
      undefined,
      txData.nonCriticalExtensionOptions,
    )
  }

  getTx(hash: string) {
    return this.client.getTx(hash)
  }
}

interface ClientState {
  client: SigningClient | null
  error: Error | null
  isLoading: boolean
}

export default function useClient(retry = 0) {
  const { chainName, gasPrice, restEndpoint, rpcEndpoint } = useRootContext()
  const { setDefaultSignOptions, isWalletConnected, address } =
    useChain(chainName)
  const signer = useOfflineSigner(chainName)

  const [state, setState] = useState<ClientState>({
    client: null,
    error: null,
    isLoading: true,
  })
  useEffect(() => {
    if (!isWalletConnected || !address || !signer) {
      return
    }
    async function createSigningClient(address: string) {
      setDefaultSignOptions({ preferNoSetFee: true, preferNoSetMemo: true })
      try {
        const signingClient = await SigningStargateClient.connectWithSigner(
          rpcEndpoint,
          signer!,
          {
            gasPrice: GasPrice.fromString(gasPrice),
            simulateEndpoint: restEndpoint as string,
          },
        )
        setState({
          client: new SigningClient(signingClient, address),
          error: null,
          isLoading: false,
        })
      } catch (err) {
        setState({ client: null, error: err as Error, isLoading: false })
      }
    }
    createSigningClient(address)
  }, [
    restEndpoint,
    rpcEndpoint,
    signer,
    setDefaultSignOptions,
    isWalletConnected,
    gasPrice,
    address,
    retry,
  ])

  return state
}
