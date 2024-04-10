import { useEffect, useState } from 'react'
import type { Royalty } from '~/api/client'
import useAsteroidClient from '~/hooks/useAsteroidClient'

export default function useRoyalty(inscriptionId: number) {
  const [royalty, setRoyalty] = useState<Royalty | null>(null)

  const asteroidClient = useAsteroidClient()
  useEffect(() => {
    if (!inscriptionId) {
      return
    }

    asteroidClient.getRoyalty(inscriptionId).then(setRoyalty)
  }, [asteroidClient, inscriptionId])

  return royalty
}
