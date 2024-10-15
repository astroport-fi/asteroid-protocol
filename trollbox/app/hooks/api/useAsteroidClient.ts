import { useMemo } from 'react'
import { AsteroidClient } from '~/api/client'
import { useRootContext } from '~/context/root'

export default function useAsteroidClient(useWs: boolean = false) {
  const { asteroidApi, asteroidWs } = useRootContext()
  return useMemo(() => {
    if (useWs) {
      return new AsteroidClient(asteroidApi, asteroidWs)
    }
    return new AsteroidClient(asteroidApi)
  }, [asteroidApi, asteroidWs, useWs])
}
