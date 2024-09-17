import { NFTMetadata } from '@asteroid-protocol/sdk'
import useSWR from 'swr'
import { useRootContext } from '~/context/root'
import { fetcher } from '~/hooks/utils'

export default function useMetadata(folder: string, tokenId: number) {
  const { assetsUrl } = useRootContext()
  return useSWR<NFTMetadata>(
    `${assetsUrl}/${folder}/${tokenId}_metadata.json`,
    fetcher,
  )
}
