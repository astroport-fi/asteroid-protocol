import { useRootContext } from '~/context/root'
import useChain from './useChain'

export default function useAddress() {
  const { chainName } = useRootContext()
  const chain = useChain(chainName)
  if (!chain) return
  return chain.address
}
