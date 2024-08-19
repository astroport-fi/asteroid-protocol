import { useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { LaunchpadInscription } from '~/api/upload'
import { useRootContext } from '~/context/root'
import { fetcher } from '~/hooks/utils'

export default function useUploadedInscriptions(launchHash: string) {
  const { uploadApi } = useRootContext()

  return useSWR<LaunchpadInscription[]>(
    launchHash ? `${uploadApi}/inscriptions/${launchHash}` : null,
    fetcher,
  )
}

export function useInvalidateUploadedInscriptions(launchHash: string) {
  const { mutate } = useSWRConfig()
  const { uploadApi } = useRootContext()
  return useCallback(() => {
    mutate(`${uploadApi}/inscriptions/${launchHash}`)
  }, [mutate, uploadApi, launchHash])
}
