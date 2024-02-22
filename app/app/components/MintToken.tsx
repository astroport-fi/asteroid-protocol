import { TxInscription } from '@asteroid-protocol/sdk'
import { useState } from 'react'
import { Button } from 'react-daisyui'
import TxDialog from '~/components/dialogs/TxDialog'
import useDialog from '~/hooks/useDialog'
import { useCFT20Operations } from '~/hooks/useOperations'

export default function MintToken({
  className,
  amount,
  ticker,
}: {
  ticker: string
  amount: number
  className?: string
}) {
  const operations = useCFT20Operations()
  const [txInscription, setTxInscription] = useState<TxInscription | null>(null)
  const { dialogRef, handleShow } = useDialog()

  function mint() {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.mint(ticker, amount)

    setTxInscription(txInscription)

    handleShow()
  }

  return (
    <div className={className}>
      <Button onClick={() => mint()} color="primary">
        Mint now
      </Button>
      <TxDialog
        ref={dialogRef}
        txInscription={txInscription}
        resultCTA="Back to mint"
        resultLink={`/mint/${ticker}`}
      />
    </div>
  )
}
