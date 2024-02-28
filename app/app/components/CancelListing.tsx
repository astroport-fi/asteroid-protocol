import type { TxInscription } from '@asteroid-protocol/sdk'
import { useState } from 'react'
import { Button } from 'react-daisyui'
import TxDialog from '~/components/dialogs/TxDialog'
import useDialog from '~/hooks/useDialog'
import { useMarketplaceOperations } from '~/hooks/useOperations'

export default function CancelListing({
  className,
  listingHash,
  onClick,
}: {
  listingHash: string
  className?: string
  onClick?: () => void
}) {
  const operations = useMarketplaceOperations()
  const [txInscription, setTxInscription] = useState<TxInscription | null>(null)
  const { dialogRef, handleShow } = useDialog()

  function cancelListing() {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.delist(listingHash)

    setTxInscription(txInscription)

    onClick?.()
    handleShow()
  }

  // @todo resultLink - handle both marketplace kinds
  return (
    <div className={className}>
      <Button onClick={() => cancelListing()} color="primary">
        Cancel listing
      </Button>
      <TxDialog
        ref={dialogRef}
        txInscription={txInscription}
        resultCTA="Back to market"
        resultLink={`/app/inscriptions`}
      />
    </div>
  )
}
