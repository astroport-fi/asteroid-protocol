import { useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { clientOnly$ } from 'vite-env-only'
import useCosmosClient from './useCosmosClient'

export function useInvalidateSendAuthorizationAmount(
  granter: string,
  grantee: string,
) {
  const { mutate } = useSWRConfig()
  return useCallback(() => {
    mutate([granter, grantee])
  }, [mutate, grantee, granter])
}

export default function useGetSendAuthorizationAmount(
  granter: string,
  grantee: string,
) {
  const client = clientOnly$(useCosmosClient())
  return useSWR(
    client && client.client && granter && grantee ? [granter, grantee] : null,
    () => client!.client!.getSendAuthorizationAmount(granter, grantee),
  )
}
