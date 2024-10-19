import useSWR from 'swr'
import { fetcher } from '~/hooks/utils'

export const STARGAZE_ENDPOINT =
  'https://rest.stargaze-apis.com/cosmwasm/wasm/v1/contract/stars1fx74nkqkw2748av8j7ew7r3xt9cgjqduwn8m0ur5lhe49uhlsasszc5fhr/smart/'

export default function useStargazeName(address: string) {
  const shouldFetch = address.startsWith('cosmos')
  const query = {
    name: { address },
  }
  const queryBase64 = btoa(JSON.stringify(query))
  const { data, error, isLoading } = useSWR<{ data: string }>(
    shouldFetch ? `${STARGAZE_ENDPOINT}${queryBase64}` : null,
    fetcher,
  )

  return {
    name: data?.data,
    isLoading,
    isError: error,
  }
}
