import useSWR from 'swr'
import useAsteroidClient from '~/hooks/useAsteroidClient'

export default function useRoyalty(inscriptionId: number) {
  const asteroidClient = useAsteroidClient()

  return useSWR(inscriptionId ? ['royalty', inscriptionId] : null, () =>
    asteroidClient.getRoyalty(inscriptionId),
  )
}
