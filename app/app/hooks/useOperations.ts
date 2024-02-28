import {
  CFT20Operations,
  InscriptionOperations,
  MarketplaceOperations,
} from '@asteroid-protocol/sdk'
import { useMemo } from 'react'
import { clientOnly$ } from 'vite-env-only'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import useAsteroidClient from '~/hooks/useAsteroidClient'

export function useInscriptionOperations<T extends boolean = true>(
  multi = true as T,
) {
  const { chainId, useIbc } = useRootContext()
  const address = useAddress()

  return useMemo(() => {
    if (!address) {
      return null
    }

    return clientOnly$(
      new InscriptionOperations(chainId, address, {
        multi,
        useIbc,
      }),
    )
  }, [chainId, address, useIbc, multi])
}

export function useCFT20Operations<T extends boolean = true>(
  multi = true as T,
) {
  const { chainId, useIbc } = useRootContext()
  const address = useAddress()

  return useMemo(() => {
    if (!address) {
      return null
    }

    return clientOnly$(
      new CFT20Operations(chainId, address, {
        multi,
        useIbc,
      }),
    )
  }, [chainId, address, useIbc, multi])
}

export function useMarketplaceOperations<T extends boolean = true>(
  multi = true as T,
) {
  const { chainId, useIbc } = useRootContext()
  const address = useAddress()
  const asteroidClient = useAsteroidClient()

  return useMemo(() => {
    if (!address) {
      return null
    }

    return clientOnly$(
      new MarketplaceOperations(chainId, address, asteroidClient, {
        multi,
        useIbc,
      }),
    )
  }, [chainId, address, useIbc, asteroidClient, multi])
}
