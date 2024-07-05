import useSWR from 'swr'
import useAsteroidClient from '~/hooks/api/useAsteroidClient'

export default function useCollection(collectionId: number) {
  const asteroidClient = useAsteroidClient()

  return useSWR(collectionId ? ['collection', collectionId] : null, () =>
    asteroidClient.getCollectionById(collectionId),
  )
}
