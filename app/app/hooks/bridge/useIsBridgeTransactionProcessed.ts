import useSWR from 'swr'
import { clientOnly$ } from 'vite-env-only'
import { BridgeHistory } from '~/api/bridge'
import useAsteroidBridgeClient from './useAsteroidBridgeClient'

export default function useIsBridgeTransactionProcessed(
  bridgeHistory: BridgeHistory | undefined,
) {
  const bridgeClient = clientOnly$(useAsteroidBridgeClient())

  return useSWR(
    bridgeHistory && bridgeClient?.client
      ? ['bridge-tx', bridgeHistory.transaction.hash]
      : null,
    () => {
      if (!bridgeHistory) {
        return
      }

      if (bridgeHistory.action === 'recv') {
        return true
      }

      return bridgeClient!.client!.isTransactionProcessed({
        transactionHash: bridgeHistory.transaction.hash,
      })
    },
  )
}
