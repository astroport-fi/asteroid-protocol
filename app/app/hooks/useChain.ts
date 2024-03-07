import { useChain as useChainOriginal } from '@cosmos-kit/react'
import type { SignerOptions, WalletStatus } from 'cosmos-kit'
import { clientOnly$ } from 'vite-env-only'

export default function useChain(chainName: string) {
  const chain = clientOnly$(useChainOriginal(chainName))
  if (!chain)
    return {
      status: 'Disconnected' as WalletStatus.Disconnected,
      openView: () => {},
      connect: () => {},
      message: undefined,
      wallet: undefined,
      getRpcEndpoint: () => '',
      getRestEndpoint: () => '',
      setDefaultSignOptions: (options: SignerOptions) => {},
      getOfflineSignerDirect: undefined,
      isWalletConnected: false,
      address: undefined,
    }
  return chain
}
