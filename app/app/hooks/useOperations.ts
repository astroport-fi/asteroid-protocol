import {
  CFT20Operations,
  InscriptionOperations,
  MarketplaceOperations,
} from '@asteroid-protocol/sdk'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import useAsteroidClient from '~/hooks/useAsteroidClient'

export function useInscriptionOperations() {
  const { chainId, useIbc } = useRootContext()
  const address = useAddress()

  if (!address) {
    return null
  }

  return new InscriptionOperations(chainId, address, {
    multi: false,
    useIbc,
  })
}

export function useCFT20Operations() {
  const { chainId, useIbc } = useRootContext()
  const address = useAddress()

  if (!address) {
    return null
  }

  return new CFT20Operations(chainId, address, {
    multi: false,
    useIbc,
  })
}

export function useMarketplaceOperations() {
  const { chainId, useIbc } = useRootContext()
  const address = useAddress()
  const asteroidClient = useAsteroidClient()

  if (!address) {
    return null
  }

  return new MarketplaceOperations(chainId, address, asteroidClient, {
    multi: false,
    useIbc,
  })
}
