import type { TxInscription } from '@asteroid-protocol/sdk'
import { forwardRef } from 'react'
import { Button, Form, Modal } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { Inscription } from '~/api/inscription'
import { MIN_DEPOSIT_PERCENT, TIMEOUT_BLOCKS } from '~/constants'
import { useDialogWithValue } from '~/hooks/useDialog'
import useForwardRef from '~/hooks/useForwardRef'
import { useMarketplaceOperations } from '~/hooks/useOperations'
import NumericInput from '../form/NumericInput'
import TxDialog from './TxDialog'

interface Props {
  inscription: Inscription
}

type FormData = {
  price: number
}

const SellInscriptionDialog = forwardRef<HTMLDialogElement, Props>(
  function SellInscriptionDialog({ inscription }, ref) {
    // form
    const {
      handleSubmit,
      control,
      formState: { errors },
    } = useForm<FormData>({
      defaultValues: {
        price: 10,
      },
    })

    const operations = useMarketplaceOperations()
    const fRef = useForwardRef(ref)

    // dialog
    const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

    const onSubmit = handleSubmit(async (data) => {
      if (!operations) {
        console.warn('No address')
        return
      }

      const txInscription = operations.listInscription(
        inscription.transaction.hash,
        data.price,
        MIN_DEPOSIT_PERCENT,
        TIMEOUT_BLOCKS,
      )

      fRef.current?.close()
      showDialog(txInscription)
    })

    return (
      <Modal ref={ref} backdrop>
        <Modal.Header className="text-center">
          List &quot;{inscription.name}&quot; for sale
        </Modal.Header>
        <Modal.Body>
          <p>This transaction will list your inscription for sale</p>
          <p>
            You&apos;ll only receive the ATOM from the sale should someone
            purchase it
          </p>
          <p className="mt-4">
            Sales are final and can&apos;t be refunded. You may cancel a listing
            at any time before a successful reservation
          </p>
          <Form onSubmit={onSubmit} className="flex flex-col items-center">
            <div className="flex flex-row mt-8">
              <NumericInput
                control={control}
                name="price"
                error={errors.price}
                title="Price (ATOM)"
                required
                isFloat
              />
            </div>

            <Button color="primary" type="submit" className="mt-4">
              Confirm and list
            </Button>
          </Form>
          <TxDialog
            txInscription={value}
            ref={dialogRef}
            resultCTA="Back to market"
          />
        </Modal.Body>
        <Modal.Actions className="flex justify-center">
          <form method="dialog" className="flex flex-col">
            <Button className="no-underline" variant="link">
              Close
            </Button>
          </form>
        </Modal.Actions>
      </Modal>
    )
  },
)
export default SellInscriptionDialog
