import { useRootContext } from '~/context/root'
import useChain from './useChain'

export default function useAddress() {
  const { chainName } = useRootContext()
  const chain = useChain(chainName)
  if (!chain) return
  return chain.address
}

export function useNeutronAddress() {
  const { neutronChainName } = useRootContext()
  const chain = useChain(neutronChainName)
  if (!chain) return
  return chain.address
}
