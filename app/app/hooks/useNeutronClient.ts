import { useRootContext } from '~/context/root'
import { useQueryingCosmWasmClient } from './useCosmWasmClient'

export default function useNeutronClient() {
  const { neutronRpcEndpoint } = useRootContext()
  return useQueryingCosmWasmClient(neutronRpcEndpoint)
}
