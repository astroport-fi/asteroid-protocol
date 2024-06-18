import useSWR from 'swr'
import { clientOnly$ } from 'vite-env-only'
import useAsteroidBridgeClient from './useAsteroidBridgeClient'

export default function useIsTransactionProcessed(txHash: string) {
  const bridgeClient = clientOnly$(useAsteroidBridgeClient())

  return useSWR(
    txHash && bridgeClient?.client ? ['bridge-tx', txHash] : null,
    () =>
      bridgeClient!.client!.isTransactionProcessed({
        transactionHash: txHash,
      }),
  )
}
