import useSWR from 'swr'
import useAsteroidClient from '~/hooks/useAsteroidClient'

export default function useTokenHolding(tokenId: number, address: string) {
  const asteroidClient = useAsteroidClient()

  return useSWR(tokenId ? ['token-holding', tokenId, address] : null, () =>
    asteroidClient.getTokenHolding(tokenId, address),
  )
}
