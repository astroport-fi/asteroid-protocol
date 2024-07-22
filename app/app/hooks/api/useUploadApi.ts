import { useMemo } from 'react'
import { UploadApi } from '~/api/upload'
import { useRootContext } from '~/context/root'

export default function useUploadApi() {
  const { uploadApi } = useRootContext()
  return useMemo(() => {
    return new UploadApi(uploadApi)
  }, [uploadApi])
}
