import { Button } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { InscriptionWithMarket } from '~/api/inscription'
import useAddress from '~/hooks/useAddress'
import useDialog from '~/hooks/useDialog'
import useRoyalty from '~/hooks/useRoyalty'
import { getDecimalValue } from '~/utils/number'
import CancelListing from './CancelListing'
import BuyDialog from './dialogs/BuyDialog'
import SellInscriptionDialog from './dialogs/SellInscriptionDialog'
import TransferInscriptionDialog from './dialogs/TransferInscriptionDialog'

interface Props {
  inscription: InscriptionWithMarket
}

export function InscriptionActions({ inscription }: Props) {
  const address = useAddress()
  const { dialogRef: transferDialogRef, showDialog: showTransferDialog } =
    useDialog()
  const { dialogRef: sellDialogRef, showDialog: showSellDialog } = useDialog()
  const { dialogRef: buyDialogRef, showDialog: showBuyDialog } = useDialog()
  const listing = inscription?.marketplace_listing
  const royalty = useRoyalty(inscription?.id ?? 0)

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

  if (listing) {
    if (address == listing.seller_address) {
      return (
        <div className="flex flex-row">
          <CancelListing listingHash={listing.transaction.hash} />
        </div>
      )
    }

    return (
      <div>
        <Button
          color="primary"
          type="submit"
          onClick={() => {
            showBuyDialog()
          }}
        >
          <div>
            Buy now for
            <NumericFormat
              className="mx-1"
              displayType="text"
              thousandSeparator
              value={getDecimalValue(listing.total, 6)}
            />
            ATOM
          </div>
        </Button>
        <BuyDialog
          buyType="inscription"
          royalty={royalty ?? undefined}
          listingHash={listing?.transaction.hash ?? null}
          ref={buyDialogRef}
        />
      </div>
    )
  }
}
