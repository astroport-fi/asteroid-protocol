import type { TxInscription } from '@asteroid-protocol/sdk'
import { Button } from 'react-daisyui'
import TxDialog from '~/components/dialogs/TxDialog'
import { useDialogWithValue } from '~/hooks/useDialog'
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
  const { dialogRef, showDialog, value } = useDialogWithValue<TxInscription>()

  function cancelListing() {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.delist(listingHash)

    onClick?.()
    showDialog(txInscription)
  }

  return (
    <div className={className}>
      <Button onClick={() => cancelListing()} color="primary">
        Cancel listing
      </Button>
      <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultCTA="Back to market"
      />
    </div>
  )
}
