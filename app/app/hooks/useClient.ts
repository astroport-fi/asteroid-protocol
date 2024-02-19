import { SigningStargateClient } from '@asteroid-protocol/sdk'
import { GasPrice } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import { useEffect, useState } from 'react'
import { useRootContext } from '~/context/root'

export default function useClient() {
  const { chainName, gasPrice } = useRootContext()
  const { getRpcEndpoint, getOfflineSignerDirect, isWalletConnected } =
    useChain(chainName)

  const [client, setClient] = useState<SigningStargateClient>()
  useEffect(() => {
    if (!isWalletConnected) {
      return
    }
    async function createSigningClient() {
      const rpcEndpoint = await getRpcEndpoint()
      const signer = getOfflineSignerDirect()
      const signingClient = await SigningStargateClient.connectWithSigner(
        rpcEndpoint,
        signer,
        { gasPrice: GasPrice.fromString(gasPrice) },
      )
      setClient(signingClient)
    }
    createSigningClient()
  }, [getRpcEndpoint, getOfflineSignerDirect, isWalletConnected, gasPrice])

  return client
}
