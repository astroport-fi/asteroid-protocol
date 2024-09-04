import { useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { useRootContext } from '~/context/root'
import useUploadApi from '../api/useUploadApi'

export default function useUploadedInscriptions(launchHash: string) {
  const uploadApi = useUploadApi()
  const { uploadApi: uploadApiUrl } = useRootContext()

  return useSWR(
    launchHash ? `${uploadApiUrl}/inscriptions/${launchHash}` : null,
    () => uploadApi.getInscriptions(launchHash),
  )
}

export function useInvalidateUploadedInscriptions(launchHash: string) {
  const { mutate } = useSWRConfig()
  const { uploadApi } = useRootContext()
  return useCallback(() => {
    mutate(`${uploadApi}/inscriptions/${launchHash}`)
  }, [mutate, uploadApi, launchHash])
}
