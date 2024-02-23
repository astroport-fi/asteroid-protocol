import { TxInscription } from '@asteroid-protocol/sdk'
import { forwardRef, useState } from 'react'
import { Button, Form, Modal } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import useDialog from '~/hooks/useDialog'
import useForwardRef from '~/hooks/useForwardRef'
import { useInscriptionOperations } from '~/hooks/useOperations'
import { Inscription } from '~/services/asteroid'
import CosmosAddressInput from '../form/CosmosAddressInput'
import TxDialog from './TxDialog'

interface Props {
  inscription: Inscription
}

type FormData = {
  destination: string
}

const TransferInscriptionDialog = forwardRef<HTMLDialogElement, Props>(
  function TransferInscriptionDialog({ inscription }, ref) {
    // form
    const {
      handleSubmit,
      register,
      watch,
      formState: { errors },
    } = useForm<FormData>({ defaultValues: { destination: '' } })
    const destination = watch('destination')

    const operations = useInscriptionOperations()
    const fRef = useForwardRef(ref)

    // dialog
    const { dialogRef, handleShow } = useDialog()
    const [txInscription, setTxInscription] = useState<TxInscription | null>(
      null,
    )

    const onSubmit = handleSubmit(async (data) => {
      if (!operations) {
        console.warn('No address')
        return
      }

      const txInscription = operations.transfer(
        inscription.transaction.hash,
        data.destination,
      )

      setTxInscription(txInscription)

      fRef.current?.close()
      handleShow()
    })

    return (
      <Modal ref={ref}>
        <Modal.Header className="text-center">
          Transfer inscription
        </Modal.Header>
        <Modal.Body>
          <p>Transfers are final and can&apos;t be cancelled</p>
          <Form onSubmit={onSubmit} className="flex flex-col items-center">
            <CosmosAddressInput
              register={register}
              name="destination"
              error={errors.destination}
              title="Destination address"
              value={destination}
              className="mt-6"
            />

            <Button color="primary" type="submit" className="mt-4">
              Send now
            </Button>
          </Form>
          <TxDialog
            txInscription={txInscription}
            ref={dialogRef}
            resultCTA="View transaction"
            resultlink={`/app/inscription/${inscription.transaction.hash}`}
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
export default TransferInscriptionDialog
