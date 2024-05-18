import useSWR from 'swr'
import useAsteroidClient from '~/hooks/useAsteroidClient'

export default function useFindBridgeTokens(search: string) {
  const asteroidClient = useAsteroidClient()

  return useSWR(search ? ['find-bridge-tokens', search] : null, () =>
    asteroidClient.findBridgeTokens(search),
  )
}
