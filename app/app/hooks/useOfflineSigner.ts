import { OfflineSigner } from '@cosmjs/proto-signing'
import { useEffect, useState } from 'react'
import useChain from '~/hooks/useChain'

export default function useOfflineSigner(chainName: string) {
  const { chainWallet } = useChain(chainName)
  const [offlineSigner, setOfflineSigner] = useState<OfflineSigner | null>(null)

  useEffect(() => {
    chainWallet?.client.getAccount?.(chainWallet.chainId).then((account) => {
      if (account.isNanoLedger) {
        const aminoSigner = chainWallet.client.getOfflineSignerAmino?.(
          chainWallet.chainId,
        )
        if (aminoSigner) {
          setOfflineSigner(aminoSigner)
        }
        return
      }

      const directSigner = chainWallet.client.getOfflineSignerDirect?.(
        chainWallet.chainId,
      )
      if (directSigner) {
        setOfflineSigner(directSigner)
      }
    })
  }, [chainWallet])

  return offlineSigner
}
