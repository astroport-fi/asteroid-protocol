import { useMemo } from 'react'
import { useRootContext } from '~/context/root'
import { AsteroidService } from '~/services/asteroid'

export default function useAsteroidClient() {
  const { asteroidApi } = useRootContext()
  return useMemo(() => new AsteroidService(asteroidApi), [asteroidApi])
}
