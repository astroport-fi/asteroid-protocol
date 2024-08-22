import { useMemo } from 'react'
import { UploadApi } from '~/api/upload'
import { useRootContext } from '~/context/root'
import { useUploaderSessionStorage } from '../useUploaderSession'

export default function useUploadApi() {
  const { uploadApi } = useRootContext()
  const storage = useUploaderSessionStorage()
  return useMemo(() => {
    return new UploadApi(uploadApi, storage?.session ?? undefined)
  }, [uploadApi, storage])
}
