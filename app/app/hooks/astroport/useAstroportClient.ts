import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { useMemo } from 'react'
import useSWR from 'swr'
import { useRootContext } from '~/context/root'
import useNeutronClient from '~/hooks/neutron/useNeutronClient'

interface PairResponse {
  contract_addr: string
}

export class AstroportQueryClient {
  client: CosmWasmClient
  contractAddress: string
  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client
    this.contractAddress = contractAddress
  }
  async pair(from: string, to: string): Promise<PairResponse> {
    return this.client.queryContractSmart(this.contractAddress, {
      pair: {
        asset_infos: [
          {
            native_token: {
              denom: from,
            },
          },
          {
            native_token: {
              denom: to,
            },
          },
        ],
      },
    })
  }
}

export default function useAstroportClient() {
  const { astroportFactoryContract } = useRootContext()
  const neutronClient = useNeutronClient()
  return useMemo(() => {
    if (!neutronClient) {
      return
    }

    return new AstroportQueryClient(neutronClient, astroportFactoryContract)
  }, [neutronClient, astroportFactoryContract])
}

export function usePair(from: string, to: string) {
  const astroportClient = useAstroportClient()
  return useSWR(
    astroportClient && from && to ? ['pair', from, to] : null,
    async () => {
      try {
        return await astroportClient?.pair(from, to)
      } catch (err) {
        console.warn(err)
        return null
      }
    },
    { revalidateOnFocus: false },
  )
}
