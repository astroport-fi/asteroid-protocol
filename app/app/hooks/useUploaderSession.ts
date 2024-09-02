import { useLocalStorage } from '@uidotdev/usehooks'
import { useCallback } from 'react'
import { clientOnly$ } from 'vite-env-only'
import { useRootContext } from '~/context/root'
import useUploadApi from './api/useUploadApi'
import useChain from './wallet/useChain'

export function useUploaderSessionStorage() {
  const sessionLocalStorage = clientOnly$(
    useLocalStorage<string | null>('uploader-session', null),
  )

  if (!sessionLocalStorage) {
    return
  }

  return {
    session: sessionLocalStorage[0],
    setSession: sessionLocalStorage[1],
  }
}

export function useHasUploaderSession() {
  const sessionStorage = useUploaderSessionStorage()
  return !!sessionStorage?.session
}

export default function useUploaderSession() {
  const { chainName } = useRootContext()
  const { address, signArbitrary } = useChain(chainName)
  const sessionStorage = useUploaderSessionStorage()
  const uploadApi = useUploadApi()

  const createSession = useCallback(async () => {
    if (!address || !sessionStorage || !signArbitrary) {
      return
    }

    const hash = await uploadApi.createSession(address)
    const signature = await signArbitrary(address, hash)
    await uploadApi.verifySession(
      hash,
      signature.pub_key.value,
      signature.signature,
    )
    sessionStorage.setSession(hash)
  }, [address, sessionStorage, signArbitrary, uploadApi])

  return {
    createSession,
    session: sessionStorage?.session,
  }
}
