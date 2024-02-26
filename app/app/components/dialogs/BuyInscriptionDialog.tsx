import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { Link } from '@remix-run/react'
import { format } from 'date-fns'
import { forwardRef } from 'react'
import { Button, Divider, Modal } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import useDialog from '~/hooks/useDialog'
import useForwardRef from '~/hooks/useForwardRef'
import { InscriptionWithMarket } from '~/services/asteroid'
import { DATETIME_FORMAT } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import AddressChip from '../AddressChip'
import InscriptionImage from '../InscriptionImage'
import BuyDialog from './BuyDialog'

interface Props {
  inscription: InscriptionWithMarket | null
}

const BuyInscriptionDialog = forwardRef<HTMLDialogElement, Props>(
  function BuyInscriptionDialog({ inscription }, ref) {
    const fRef = useForwardRef(ref)

    const listing =
      inscription?.marketplace_inscription_details[0]?.marketplace_listing

    // @todo cancel button when owner

    // dialog
    const { dialogRef, handleShow } = useDialog()

    return (
      <Modal ref={ref} backdrop>
        {inscription && (
          <>
            <Modal.Header className="flex flex-row items-center">
              <Button
                shape="circle"
                color="ghost"
                onClick={() => fRef.current?.close()}
              >
                <ArrowLeftIcon className="size-5" />
              </Button>
              <span className="ml-2">Inscription #{inscription.id - 1}</span>
            </Modal.Header>
            <Modal.Body className="flex flex-col items-center">
              <InscriptionImage
                mime={inscription.mime}
                src={inscription.content_path}
                isExplicit={inscription.is_explicit}
                className="rounded-xl w-2/3"
              />

              <h2 className="font-medium text-xl mt-4">{inscription.name}</h2>
              <p className="whitespace-pre-wrap mt-3">
                {inscription.description}
              </p>
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
                    <span className="uppercase text-sm text-gray-500">
                      Price
                    </span>
                  </div>
                  <Button
                    color="primary"
                    type="submit"
                    onClick={() => {
                      fRef.current?.close()
                      handleShow()
                    }}
                  >
                    Buy now
                  </Button>
                </div>
              ) : (
                <span className="text-lg">No listing</span>
              )}

              <BuyDialog
                buyType="inscription"
                listingHash={listing?.transaction.hash ?? null}
                resultLink={`/app/inscriptions`}
                ref={dialogRef}
              />
            </Modal.Body>
            <Modal.Actions className="flex justify-center"></Modal.Actions>
          </>
        )}
      </Modal>
    )
  },
)
export default BuyInscriptionDialog
