import { useMemo } from 'react'
import { AsteroidClient } from '~/api/client'
import { useRootContext } from '~/context/root'

export default function useAsteroidClient() {
  const { asteroidApi } = useRootContext()
  return useMemo(() => new AsteroidClient(asteroidApi), [asteroidApi])
}
