import type { TxInscription } from '@asteroid-protocol/sdk'
import { useState } from 'react'
import { Button } from 'react-daisyui'
import { TokenDetail } from '~/api/token'
import TxDialog from '~/components/dialogs/TxDialog'
import useDialog from '~/hooks/useDialog'
import { useCFT20Operations } from '~/hooks/useOperations'
import { Wallet } from './wallet/Wallet'

export default function MintToken({
  className,
  token,
  showConnectWallet,
}: {
  token: TokenDetail
  className?: string
  showConnectWallet?: boolean
}) {
  const operations = useCFT20Operations()
  const [txInscription, setTxInscription] = useState<TxInscription | null>(null)
  const { dialogRef, handleShow } = useDialog()

  function mint() {
    if (!operations) {
      console.warn('No address')
      handleShow()
      return
    }

    const txInscription = operations.mint(token.ticker, token.per_mint_limit)

    setTxInscription(txInscription)

    handleShow()
  }

  return (
    <div className={className}>
      {operations || !showConnectWallet ? (
        <Button onClick={() => mint()} color="primary">
          Mint now
        </Button>
      ) : (
        <Wallet className="btn-md" color="primary" />
      )}
      <TxDialog
        ref={dialogRef}
        txInscription={txInscription}
        resultCTA="Back to mint"
        resultLink={`/mint/${token.ticker}`}
      />
    </div>
  )
}
