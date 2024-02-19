import { useChain } from '@cosmos-kit/react'
import { useRootContext } from '~/context/root'

export default function useAddress() {
  const { chainName } = useRootContext()
  const { address } = useChain(chainName)
  return address
}
