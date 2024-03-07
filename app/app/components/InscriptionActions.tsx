import { Button } from 'react-daisyui'
import { InscriptionWithMarket } from '~/api/inscription'
import useAddress from '~/hooks/useAddress'
import useDialog from '~/hooks/useDialog'
import CancelListing from './CancelListing'
import SellInscriptionDialog from './dialogs/SellInscriptionDialog'
import TransferInscriptionDialog from './dialogs/TransferInscriptionDialog'

interface Props {
  inscription: InscriptionWithMarket
}

export function InscriptionActions({ inscription }: Props) {
  const address = useAddress()
  const { dialogRef: transferDialogRef, handleShow: showTransferDialog } =
    useDialog()
  const { dialogRef: sellDialogRef, handleShow: showSellDialog } = useDialog()
  const listing = inscription?.marketplace_listing

  if (address == inscription.current_owner) {
    return (
      <div className="flex flex-row">
        <Button color="primary" onClick={() => showTransferDialog()}>
          Send
        </Button>
        <Button
          className="ml-2"
          color="primary"
          onClick={() => showSellDialog()}
        >
          Sell
        </Button>
        <TransferInscriptionDialog
          inscription={inscription}
          ref={transferDialogRef}
        />
        <SellInscriptionDialog inscription={inscription} ref={sellDialogRef} />
      </div>
    )
  }

  if (listing && address == listing.seller_address) {
    return (
      <div className="flex flex-row">
        <CancelListing listingHash={listing.transaction.hash} />
      </div>
    )
  }
}
