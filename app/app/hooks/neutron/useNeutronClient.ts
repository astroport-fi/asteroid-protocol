import { clientOnly$ } from 'vite-env-only'
import { useRootContext } from '~/context/root'
import { useQueryingCosmWasmClient } from '~/hooks/useCosmWasmClient'

export default function useNeutronClient() {
  const { neutronRpcEndpoint } = useRootContext()
  return clientOnly$(useQueryingCosmWasmClient(neutronRpcEndpoint))
}
