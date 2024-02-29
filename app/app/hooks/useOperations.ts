import {
  CFT20Operations,
  CFT20Protocol,
  InscriptionOperations,
  InscriptionProtocol,
  MarketplaceOperations,
  MarketplaceProtocol,
} from '@asteroid-protocol/sdk'
import { ProtocolFee } from '@asteroid-protocol/sdk/metaprotocol'
import { useMemo } from 'react'
import { clientOnly$ } from 'vite-env-only'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import useAsteroidClient from '~/hooks/useAsteroidClient'

function getFee(fee: ProtocolFee, useIbc: boolean): ProtocolFee | undefined {
  if (useIbc) {
    return
  }

  return { ...fee, receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv' }
}

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
        fee: getFee(InscriptionProtocol.DEFAULT_FEE, useIbc),
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
        fee: getFee(CFT20Protocol.DEFAULT_FEE, useIbc),
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
        fee: getFee(MarketplaceProtocol.DEFAULT_FEE, useIbc),
      }),
    )
  }, [chainId, address, useIbc, asteroidClient, multi])
}
