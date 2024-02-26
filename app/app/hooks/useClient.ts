import { SigningStargateClient, TxData } from '@asteroid-protocol/sdk'
import { GasPrice } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import { useEffect, useState } from 'react'
import { useRootContext } from '~/context/root'

export class SigningClient {
  client: SigningStargateClient
  address: string

  constructor(client: SigningStargateClient, address: string) {
    this.client = client
    this.address = address
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
    )
    return parseInt(usedFee.amount[0].amount)
  }

  async signAndBroadcast(txData: TxData) {
    return this.client.signAndBroadcast(
      this.address,
      txData.messages,
      'auto',
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
  const { chainName, gasPrice } = useRootContext()
  const {
    getRpcEndpoint,
    getRestEndpoint,
    getOfflineSignerDirect,
    isWalletConnected,
    address,
  } = useChain(chainName)

  const [client, setClient] = useState<SigningClient>()
  useEffect(() => {
    if (!isWalletConnected || !address) {
      return
    }
    async function createSigningClient(address: string) {
      const rpcEndpoint = await getRpcEndpoint()
      const restEndpoint = await getRestEndpoint()
      const signer = getOfflineSignerDirect()
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
    getRpcEndpoint,
    getRestEndpoint,
    getOfflineSignerDirect,
    isWalletConnected,
    gasPrice,
    address,
    retry,
  ])

  return client
}
