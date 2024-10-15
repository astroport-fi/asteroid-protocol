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
      chainWallet: undefined,
      getRpcEndpoint: undefined,
      getRestEndpoint: () => '',
      getStargateClient: undefined,
      setDefaultSignOptions: (options: SignerOptions) => {},
      getSigningCosmWasmClient: undefined,
      isWalletConnected: false,
      address: undefined as string | undefined,
      signArbitrary: undefined,
    }
  return chain
}
