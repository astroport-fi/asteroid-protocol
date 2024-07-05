import useSWR from 'swr'
import useAsteroidClient from '~/hooks/api/useAsteroidClient'

export default function useRoyalty(inscriptionId: number) {
  const asteroidClient = useAsteroidClient()

  return useSWR(inscriptionId ? ['royalty', inscriptionId] : null, () =>
    asteroidClient.getRoyalty(inscriptionId),
  )
}
