import { useEffect, useState } from 'react'
import { useRootContext } from '~/context/root'
import useChain from '~/hooks/wallet/useChain'

export default function useIsLedger(chainName?: string) {
  const { chainName: cosmosChainName } = useRootContext()
  const { chainWallet } = useChain(chainName ?? cosmosChainName)
  const [isLedger, setIsLedger] = useState<boolean | null>(null)

  useEffect(() => {
    chainWallet?.client?.getAccount?.(chainWallet.chainId).then((account) => {
      if (account.isNanoLedger != null) {
        setIsLedger(account.isNanoLedger)
      }
    })
  }, [chainWallet])

  return isLedger
}
