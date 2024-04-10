import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { Link } from '@remix-run/react'
import { format } from 'date-fns'
import { forwardRef, useState } from 'react'
import { Button, Collapse, Divider, Modal } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { InscriptionWithMarket } from '~/api/inscription'
import useAddress from '~/hooks/useAddress'
import useDialog from '~/hooks/useDialog'
import useForwardRef from '~/hooks/useForwardRef'
import useRoyalty from '~/hooks/useRoyalty'
import { DATETIME_FORMAT } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import AddressChip from '../AddressChip'
import CancelListing from '../CancelListing'
import { CollapseTextContent, CollapseTextTrigger } from '../CollapseText'
import InscriptionImage from '../InscriptionImage'
import BuyDialog from './BuyDialog'
import SellInscriptionDialog from './SellInscriptionDialog'

interface Props {
  inscription: InscriptionWithMarket | null
}

const BuyInscriptionDialog = forwardRef<HTMLDialogElement, Props>(
  function BuyInscriptionDialog({ inscription }, ref) {
    const fRef = useForwardRef(ref)

    const listing = inscription?.marketplace_listing

    const address = useAddress()

    // dialog
    const { dialogRef, showDialog } = useDialog()
    const { dialogRef: sellDialogRef, showDialog: showSellDialog } = useDialog()

    const royalty = useRoyalty(inscription?.id ?? 0)

    const [open, setOpen] = useState(false)

    return (
      <Modal ref={ref} backdrop className="p-0">
        {inscription && (
          <>
            <Modal.Header className="flex flex-row items-center px-4 pt-6">
              <Button
                shape="circle"
                color="ghost"
                onClick={() => fRef.current?.close()}
              >
                <ArrowLeftIcon className="size-5" />
              </Button>
              <span className="ml-2">
                Inscription #{inscription.inscription_number! - 1}
              </span>
            </Modal.Header>
            <Modal.Body className="flex flex-col items-center">
              <div className="flex flex-col items-center px-8 overflow-y-scroll max-h-[calc(100vh-290px)] mb-20">
                <InscriptionImage
                  mime={inscription.mime}
                  src={inscription.content_path}
                  isExplicit={inscription.is_explicit}
                  className="w-2/3 max-w-lg"
                  imageClassName="rounded-xl object-contain"
                />

                <h2 className="font-medium text-xl mt-4">{inscription.name}</h2>
                <div className="flex">
                  {inscription.description && (
                    <Collapse open={open} className="mt-3 rounded-none">
                      <CollapseTextTrigger
                        onToggle={() => setOpen(!open)}
                        title={inscription.description}
                      />

                      <CollapseTextContent>
                        {inscription.description}
                      </CollapseTextContent>
                    </Collapse>
                  )}
                </div>

                <div className="mt-3">
                  {format(inscription.date_created, DATETIME_FORMAT)}
                </div>

                <div className="flex flex-row w-full mt-6">
                  <div className="flex flex-col w-full items-center">
                    <strong className="mb-1">Created by</strong>
                    <AddressChip address={inscription.creator} />
                  </div>
                  {listing ? (
                    <div className="flex flex-col w-full items-center">
                      <strong className="mb-1">Seller</strong>
                      <AddressChip address={listing.seller_address} />
                    </div>
                  ) : (
                    <div className="flex flex-col w-full items-center">
                      <strong className="mb-1">Owned by</strong>
                      <AddressChip address={inscription.current_owner} />
                    </div>
                  )}
                </div>

                <Link
                  to={`/app/inscription/${inscription.transaction.hash}`}
                  className="btn btn-link mt-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View full details{' '}
                  <ArrowTopRightOnSquareIcon className="size-5" />
                </Link>
              </div>

              <div className="flex flex-col w-full px-8 fixed left-0 bottom-8">
                <Divider />
                {listing ? (
                  <div className="flex flex-row w-full justify-between items-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg">
                        <NumericFormat
                          className="mr-1"
                          displayType="text"
                          thousandSeparator
                          value={getDecimalValue(listing.total, 6)}
                        />
                        <span>ATOM</span>
                      </span>
                      <span className="uppercase text-sm text-header-content">
                        Price
                      </span>
                    </div>
                    {listing.seller_address == address ? (
                      <CancelListing
                        listingHash={listing.transaction.hash}
                        onClick={() => fRef.current?.close()}
                      />
                    ) : (
                      <Button
                        color="primary"
                        type="submit"
                        onClick={() => {
                          fRef.current?.close()
                          showDialog()
                        }}
                      >
                        Buy now
                      </Button>
                    )}
                  </div>
                ) : inscription.current_owner == address ? (
                  <Button
                    color="primary"
                    onClick={() => {
                      fRef.current?.close()
                      showSellDialog()
                    }}
                  >
                    List inscription
                  </Button>
                ) : (
                  <span className="text-lg">No listing</span>
                )}

                <BuyDialog
                  buyType="inscription"
                  royalty={royalty ?? undefined}
                  listingHash={listing?.transaction.hash ?? null}
                  ref={dialogRef}
                />
                <SellInscriptionDialog
                  inscription={inscription}
                  ref={sellDialogRef}
                />
              </div>
            </Modal.Body>
            <Modal.Actions className="flex justify-center"></Modal.Actions>
          </>
        )}
      </Modal>
    )
  },
)
export default BuyInscriptionDialog
