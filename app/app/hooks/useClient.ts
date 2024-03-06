import { SigningStargateClient, TxData } from '@asteroid-protocol/sdk'
import { GasPrice } from '@cosmjs/stargate'
import { useEffect, useState } from 'react'
import { useRootContext } from '~/context/root'
import useChain from './useChain'

export class SigningClient {
  client: SigningStargateClient
  address: string
  feeMultiplier: number

  constructor(
    client: SigningStargateClient,
    address: string,
    feeMultiplier = 1.7,
  ) {
    this.client = client
    this.address = address
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
      this.feeMultiplier,
    )
    return parseInt(usedFee.amount[0].amount)
  }

  async signAndBroadcast(txData: TxData) {
    return this.client.signAndBroadcast(
      this.address,
      txData.messages,
      this.feeMultiplier,
      txData.memo,
      undefined,
      txData.nonCriticalExtensionOptions,
    )
  }

  async signAndBroadcastSync(txData: TxData) {
    return this.client.signAndBroadcastSync(
      this.address,
      txData.messages,
      this.feeMultiplier,
      txData.memo,
      undefined,
      txData.nonCriticalExtensionOptions,
    )
  }

  getTx(hash: string) {
    return this.client.getTx(hash)
  }
}

export default function useClient(retry = 0) {
  const { chainName, gasPrice, restEndpoint, rpcEndpoint } = useRootContext()
  const {
    getOfflineSignerDirect,
    setDefaultSignOptions,
    isWalletConnected,
    address,
  } = useChain(chainName)

  const [client, setClient] = useState<SigningClient>()
  useEffect(() => {
    if (!isWalletConnected || !address || !getOfflineSignerDirect) {
      return
    }
    async function createSigningClient(address: string) {
      const signer = getOfflineSignerDirect!()
      setDefaultSignOptions({ preferNoSetFee: true, preferNoSetMemo: true })
      const signingClient = await SigningStargateClient.connectWithSigner(
        rpcEndpoint,
        signer,
        {
          gasPrice: GasPrice.fromString(gasPrice),
          simulateEndpoint: restEndpoint as string,
        },
      )
      setClient(new SigningClient(signingClient, address))
    }
    createSigningClient(address)
  }, [
    restEndpoint,
    rpcEndpoint,
    getOfflineSignerDirect,
    setDefaultSignOptions,
    isWalletConnected,
    gasPrice,
    address,
    retry,
  ])

  return client
}
