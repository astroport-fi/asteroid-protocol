import {
  BridgeOperations,
  BridgeProtocol,
  CFT20Operations,
  CFT20Protocol,
  InscriptionOperations,
  InscriptionProtocol,
  LaunchpadOperations,
  LaunchpadProtocol,
  MarketplaceOperations,
  MarketplaceProtocol,
} from '@asteroid-protocol/sdk'
import { ProtocolFee } from '@asteroid-protocol/sdk/metaprotocol'
import { useMemo } from 'react'
import { clientOnly$ } from 'vite-env-only'
import { useRootContext } from '~/context/root'
import useAsteroidClient from '~/hooks/api/useAsteroidClient'
import useAddress from '~/hooks/wallet/useAddress'

function getFee(fee: ProtocolFee, useIbc: boolean): ProtocolFee | undefined {
  if (useIbc) {
    return
  }

  return { ...fee, receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv' }
}

export function useInscriptionOperations<T extends boolean = true>(
  multi = true as T,
) {
  const { chainId, useIbc, useExtensionData } = useRootContext()
  const address = useAddress()

  return useMemo(() => {
    if (!address) {
      return null
    }

    return clientOnly$(
      new InscriptionOperations(chainId, address, {
        multi,
        useIbc,
        useExtensionData,
        fee: getFee(InscriptionProtocol.DEFAULT_FEE, useIbc),
      }),
    )
  }, [chainId, address, useIbc, useExtensionData, multi])
}

export function useCFT20Operations<T extends boolean = true>(
  multi = true as T,
) {
  const { chainId, useIbc, useExtensionData } = useRootContext()
  const address = useAddress()

  return useMemo(() => {
    if (!address) {
      return null
    }

    return clientOnly$(
      new CFT20Operations(chainId, address, {
        multi,
        useIbc,
        useExtensionData,
        fee: getFee(CFT20Protocol.DEFAULT_FEE, useIbc),
      }),
    )
  }, [chainId, address, useIbc, useExtensionData, multi])
}

export function useMarketplaceOperations<T extends boolean = true>(
  multi = true as T,
) {
  const { chainId, useIbc, useExtensionData } = useRootContext()
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
        useExtensionData,
        fee: getFee(MarketplaceProtocol.DEFAULT_FEE, useIbc),
      }),
    )
  }, [chainId, address, useIbc, useExtensionData, asteroidClient, multi])
}

export function useBridgeOperations<T extends boolean = true>(
  multi = true as T,
) {
  const { chainId, useIbc, useExtensionData } = useRootContext()
  const address = useAddress()

  return useMemo(() => {
    if (!address) {
      return null
    }

    return clientOnly$(
      new BridgeOperations(chainId, address, {
        multi,
        useIbc,
        useExtensionData,
        fee: getFee(BridgeProtocol.DEFAULT_FEE, useIbc),
      }),
    )
  }, [chainId, address, useIbc, useExtensionData, multi])
}

export function useLaunchpadOperations<T extends boolean = true>(
  multi = true as T,
) {
  const { chainId, useIbc, useExtensionData } = useRootContext()
  const address = useAddress()

  return useMemo(() => {
    if (!address) {
      return null
    }

    return clientOnly$(
      new LaunchpadOperations(chainId, address, {
        multi,
        useIbc,
        useExtensionData,
        fee: getFee(LaunchpadProtocol.DEFAULT_FEE, useIbc),
      }),
    )
  }, [chainId, address, useIbc, useExtensionData, multi])
}
