import { useRootContext } from '~/context/root'
import { AsteroidService } from '~/services/asteroid'

export default function useAsteroidClient() {
  const { asteroidApi } = useRootContext()
  return new AsteroidService(asteroidApi)
}
