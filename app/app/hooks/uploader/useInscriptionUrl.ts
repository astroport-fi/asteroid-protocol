import { useRootContext } from '~/context/root'

export default function useInscriptionUrl(folder: string, filename: string) {
  const { assetsUrl } = useRootContext()
  return `${assetsUrl}/${folder}/${encodeURIComponent(filename)}`
}
