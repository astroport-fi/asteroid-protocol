import { useChain as useChainOriginal } from '@cosmos-kit/react-lite'
import { clientOnly$ } from 'vite-env-only'
import type { WalletStatus } from '~/components/wallet/Wallet'

export interface SignerOptions {
  preferNoSetFee: boolean
  preferNoSetMemo: boolean
}

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
      getStargateClient: undefined,
      setDefaultSignOptions: (options: SignerOptions) => {},
      getOfflineSignerDirect: undefined,
      isWalletConnected: false,
      address: undefined as string | undefined,
    }
  return chain
}
