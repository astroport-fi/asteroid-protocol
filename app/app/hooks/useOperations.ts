import {
  CFT20Operations,
  InscriptionOperations,
  MarketplaceOperations,
} from '@asteroid-protocol/sdk'
import { useMemo } from 'react'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import useAsteroidClient from '~/hooks/useAsteroidClient'

export function useInscriptionOperations<T extends boolean = false>(
  multi = false as T,
) {
  const { chainId, useIbc } = useRootContext()
  const address = useAddress()

  return useMemo(() => {
    if (!address) {
      return null
    }

    return new InscriptionOperations(chainId, address, {
      multi,
      useIbc,
    })
  }, [chainId, address, useIbc, multi])
}

export function useCFT20Operations<T extends boolean = false>(
  multi = false as T,
) {
  const { chainId, useIbc } = useRootContext()
  const address = useAddress()

  return useMemo(() => {
    if (!address) {
      return null
    }

    return new CFT20Operations(chainId, address, {
      multi,
      useIbc,
    })
  }, [chainId, address, useIbc, multi])
}

export function useMarketplaceOperations<T extends boolean = false>(
  multi = false as T,
) {
  const { chainId, useIbc } = useRootContext()
  const address = useAddress()
  const asteroidClient = useAsteroidClient()

  return useMemo(() => {
    if (!address) {
      return null
    }

    return new MarketplaceOperations(chainId, address, asteroidClient, {
      multi,
      useIbc,
    })
  }, [chainId, address, useIbc, asteroidClient, multi])
}
