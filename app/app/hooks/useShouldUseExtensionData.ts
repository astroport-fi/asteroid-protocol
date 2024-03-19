import { useEffect, useMemo, useState } from 'react'
import { clientOnly$ } from 'vite-env-only'
import { useRootContext } from '~/context/root'
import useAsteroidClient from './useAsteroidClient'
import useClient from './useClient'

const GAIA_15_UPGRADE_HEIGHT = 19639600

export default function useShouldUseExtensionData(retryCounter: number) {
  const { useExtensionData: useExtensionDataConfig, chainId } = useRootContext()
  const client = clientOnly$(useClient(retryCounter))
  const [shouldUseExtData, setShouldUseExtData] = useState(
    useExtensionDataConfig,
  )
  const asteroidClient = useAsteroidClient(clientOnly$(true))

  const wsSubscription = useMemo(() => {
    if (!asteroidClient) {
      return null
    }
    return asteroidClient.statusSubscription(chainId)
  }, [asteroidClient, chainId])

  useEffect(() => {
    if (!client || shouldUseExtData) {
      return
    }
    client.client.getHeight().then((res) => {
      setShouldUseExtData(res >= GAIA_15_UPGRADE_HEIGHT)
    })
  }, [client, shouldUseExtData])

  useEffect(() => {
    if (!wsSubscription || shouldUseExtData) {
      return
    }

    wsSubscription.on(({ status }) => {
      const newStatus = status[0]
      if (newStatus && newStatus.last_known_height) {
        setShouldUseExtData(
          newStatus.last_known_height >= GAIA_15_UPGRADE_HEIGHT,
        )
      }
    })
  }, [wsSubscription, chainId, shouldUseExtData])

  return shouldUseExtData
}
